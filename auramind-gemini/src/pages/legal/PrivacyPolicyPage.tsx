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

export const PrivacyPolicyPage = () => (
  <LegalShell
    title="PRIVACY."
    subtitle="How AuraMind handles profile data, study content, and local preferences."
    sections={[
      {
        heading: 'Profile Data',
        body: 'AuraMind stores account identity through Supabase authentication, including account profile metadata such as display name and profile media.',
      },
      {
        heading: 'Study Content',
        body: 'Decks, cards, and review activity are used to power study workflows, analytics, and scheduling. AI generation requests may process the prompts and source content you submit to the configured model provider.',
      },
      {
        heading: 'Local Preferences',
        body: 'Theme selection and tutorial completion state are stored in local browser storage to preserve the experience on the current device.',
      },
      {
        heading: 'Your Control',
        body: 'You can update or remove profile media, change settings, and sign out at any time. If server-side data deletion is required, the Supabase project must support account-level deletion workflows.',
      },
    ]}
  />
);
