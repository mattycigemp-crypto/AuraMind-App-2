import React from 'react';
import { PageHeader } from '../../components/shared/PageComponents';

const LegalShell = ({
  title,
  subtitle,
  sections,
}: {
  title: string;
  subtitle: string;
  sections: Array<{ heading: string; body: string }>;
}) => (
  <div className="space-y-10 py-4">
    <PageHeader title={title} subtitle={subtitle} />
    <div className="architectural-panel p-10 space-y-10">
      {sections.map((section) => (
        <section key={section.heading} className="space-y-6 pb-10 border-b border-arch-border last:border-0 last:pb-0">
          <h2 className="text-2xl font-black italic lowercase">{section.heading}.</h2>
          <p className="text-xs text-arch-muted font-medium leading-relaxed uppercase tracking-widest whitespace-pre-wrap">{section.body}</p>
        </section>
      ))}
    </div>
  </div>
);

const TermsOfServicePage = () => (
  <LegalShell
    title="TERMS."
    subtitle="Basic use terms for accessing AuraMind and its AI-powered study workflows."
    sections={[
      {
        heading: 'Acceptable Use',
        body: 'Use AuraMind for lawful study, research, and content organization. Do not submit harmful, abusive, or unauthorized content into the platform or its connected AI workflows.',
      },
      {
        heading: 'AI Output',
        body: 'AI-generated summaries, decks, and coaching suggestions are assistive tools. You are responsible for reviewing generated content before relying on it for critical decisions or formal academic submissions.',
      },
      {
        heading: 'Accounts and Access',
        body: 'You are responsible for activity performed through your account. Staff-only interfaces, including the admin suite, are restricted to authorized roles.',
      },
      {
        heading: 'Service Changes',
        body: 'AuraMind may evolve features, routes, AI behavior, and interface details over time. Continued use of the service indicates acceptance of the current product experience and terms.',
      },
    ]}
  />
);

export default TermsOfServicePage;
