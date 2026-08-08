import * as React from 'react';
import axe from 'axe-core';

export interface A11yIssue {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  helpUrl: string;
  nodes: { html: string; target: string[] }[];
}

export interface A11yProviderProps {
  children: React.ReactNode;
  enabled?: boolean;
  delay?: number;
}

const A11yContext = React.createContext<{
  issues: A11yIssue[];
  runAudit: () => void;
  clearIssues: () => void;
}>({ issues: [], runAudit: () => {}, clearIssues: () => {} });

export const useA11y = () => React.useContext(A11yContext);

export const A11yProvider: React.FC<A11yProviderProps> = ({
  children,
  enabled = false,
  delay = 1000,
}) => {
  const [issues, setIssues] = React.useState<A11yIssue[]>([]);
  const isDev = import.meta.env.DEV;
  const shouldRun = enabled || isDev;

  const runAudit = React.useCallback(() => {
    if (!shouldRun || typeof document === 'undefined') return;

    axe.run(
      document.body,
      {
        runOnly: {
          type: 'tag' as const,
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
        },
      },
      (err: Error | null, results: { violations: axe.RuleObject[] }) => {
        if (err || !results) return;
        const critical = results.violations
          .filter((v: any) => v.impact === 'serious' || v.impact === 'critical')
          .map((v: any) => ({
            id: v.id,
            impact: v.impact as A11yIssue['impact'],
            description: v.description,
            helpUrl: v.helpUrl,
            nodes: (v.nodes || []).slice(0, 3).map((n: any) => ({
              html: n.html,
              target: n.target as string[],
            })),
          }))
          .slice(0, 20);

        setIssues(critical);

        if (critical.length > 0 && isDev) {
          console.groupCollapsed(`[A11y] ${critical.length} a11y issues found`);
          critical.forEach((i: A11yIssue) => {
            console.warn(`[${i.impact}] ${i.id}: ${i.description}`);
          });
          console.groupEnd();
        }
      },
    );
  }, [shouldRun, isDev]);

  const clearIssues = React.useCallback(() => setIssues([]), []);

  React.useEffect(() => {
    if (!shouldRun) return;
    const t = setTimeout(runAudit, delay);
    return () => clearTimeout(t);
  }, [shouldRun, delay, runAudit]);

  return (
    <A11yContext.Provider value={{ issues, runAudit, clearIssues }}>
      {children}
    </A11yContext.Provider>
  );
};
