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

const DocsPage = () => (
  <LegalShell
    title="DOCS."
    subtitle="Core product guidance for decks, AI, profiles, settings, and study loops."
    sections={[
      {
        heading: 'Getting Started',
        body: 'Create or generate a deck, open Study Mode, and rate each card after reveal. AuraMind updates spacing based on those ratings so the system gets smarter over time.',
      },
      {
        heading: 'Aura Operator',
        body: 'Use Aura Operator for three flows: research a topic, deploy a generated deck into your library, or create a coaching sequence for the next study session.',
      },
      {
        heading: 'Profiles and Media',
        body: 'Open Settings to update your display name and upload profile media. Images and GIFs are supported and sync through your Supabase-backed account profile.',
      },
      {
        heading: 'Leaderboard and Analytics',
        body: 'Leaderboard rank is derived from actual deck score: mastery, card count, due pressure, and review volume. Insights and admin views are grounded in the current live deck/card data.',
      },
    ]}
  />
);

export default DocsPage;
