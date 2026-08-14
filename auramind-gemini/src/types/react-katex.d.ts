/**
 * Ambient declarations for `react-katex`.
 *
 * The package ships no bundled types and there is no maintained
 * `@types/react-katex` on npm, so under `strict` its imports resolve to
 * an implicit `any`. Only the two components AuraMind renders are
 * declared here; extend as needed.
 */
declare module 'react-katex' {
  import type { ComponentType, ReactNode } from 'react';

  export interface KatexProps {
    /** The LaTeX source to render. */
    math: string;
    /** Rendered instead of throwing when `math` fails to parse. */
    renderError?: (error: Error) => ReactNode;
    /** Called when parsing fails and `renderError` is absent. */
    errorColor?: string;
    children?: ReactNode;
  }

  /** Renders `math` as a centered display-mode block. */
  export const BlockMath: ComponentType<KatexProps>;

  /** Renders `math` inline with surrounding text. */
  export const InlineMath: ComponentType<KatexProps>;
}
