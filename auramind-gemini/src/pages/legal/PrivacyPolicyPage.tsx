import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon as ArrowLeft } from '../../components/icons/CustomIcons';

const sections = [
  {
    id: 'introduction',
    title: '1. Introduction',
    content: (
      <>
        <p>
          AuraMind ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered study platform, including our website, mobile application, and related services (collectively, the "Service").
        </p>
        <p>
          By using the Service, you agree to the collection and use of information in accordance with this policy. If you do not agree, please do not use the Service.
        </p>
      </>
    ),
  },
  {
    id: 'information-collection',
    title: '2. Information We Collect',
    content: (
      <>
        <h4 className="text-md font-semibold text-zinc-900 dark:text-white mt-4 mb-2">Information You Provide</h4>
        <ul className="list-disc pl-5 space-y-1.5 text-zinc-700 dark:text-zinc-300">
          <li><strong>Account Information:</strong> When you register, we collect your email address, full name, and password. You may also optionally provide a phone number for OTP verification.</li>
          <li><strong>Profile Information:</strong> Avatar image, study preferences, and any information you add to your profile.</li>
          <li><strong>Study Content:</strong> Flashcards, decks, notes, study sessions, quiz responses, and any content you create or upload.</li>
          <li><strong>Documents:</strong> PDFs, PowerPoint files, text documents, and markdown files you upload for content processing.</li>
          <li><strong>AI Interactions:</strong> Prompts, questions, and conversations you submit to our AI study assistant ("Aura").</li>
          <li><strong>Communications:</strong> Information you provide when contacting support or participating in surveys.</li>
        </ul>

        <h4 className="text-md font-semibold text-zinc-900 dark:text-white mt-4 mb-2">Information Collected Automatically</h4>
        <ul className="list-disc pl-5 space-y-1.5 text-zinc-700 dark:text-zinc-300">
          <li><strong>Usage Data:</strong> Pages visited, features used, time spent, study patterns, and interaction data.</li>
          <li><strong>Device Information:</strong> Browser type, operating system, device type, and IP address.</li>
          <li><strong>Analytics:</strong> Page views, click events, and feature usage via PostHog (with your consent where required).</li>
          <li><strong>Cookies and Similar Technologies:</strong> We use cookies to maintain sessions, remember preferences, and analyze usage. See our Cookie section below.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'how-we-use',
    title: '3. How We Use Your Information',
    content: (
      <>
        <p>We use your information for the following purposes:</p>
        <ul className="list-disc pl-5 space-y-1.5 text-zinc-700 dark:text-zinc-300">
          <li><strong>To Provide the Service:</strong> Process study content, generate flashcards and quizzes, power AI tutoring, and deliver all platform features.</li>
          <li><strong>To Improve the Service:</strong> Analyze usage patterns to improve features, optimize the FSRS spaced repetition algorithm, and enhance AI responses.</li>
            <li><strong>AI Processing:</strong> Your prompts and uploaded content are sent to our AI provider (Groq) solely to generate responses. Local inference runs entirely in your browser. We do not use your content to train or fine-tune AI models unless you explicitly opt in.</li>
          <li><strong>To Communicate:</strong> Send transactional emails (welcome, password reset, payment receipts, trial reminders) via Resend, and respond to support requests.</li>
          <li><strong>To Process Payments:</strong> Subscription payments are processed securely by Stripe. We do not store full payment card details.</li>
          <li><strong>To Ensure Security:</strong> Monitor for unauthorized access, fraud, and abuse of the Service.</li>
          <li><strong>To Comply with Legal Obligations:</strong> Fulfill legal requests, enforce our Terms of Service, and protect our rights.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'ai-disclosure',
    title: '4. AI-Specific Disclosures',
    content: (
      <>
        <p>
          AuraMind uses third-party AI providers to power its study assistant and content generation features. Here is how your data is handled in the AI context:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-zinc-700 dark:text-zinc-300">
          <li><strong>Input Handling:</strong> Your prompts, questions, and uploaded content are sent to our AI providers solely to generate responses. These are processed in real-time and are not used by our providers to train or improve their models.</li>
          <li><strong>No Model Training:</strong> We do not use your study content, AI interactions, or personal data to train, fine-tune, or improve AI models without your explicit, informed consent.</li>
          <li><strong>Opt-Out:</strong> You may opt out of any future data usage for model improvement at any time by contacting us. AI inputs used solely for inference are never used for training.</li>
          <li><strong>AI Output Caution:</strong> AI-generated content (flashcards, quiz questions, explanations) may contain inaccuracies. You are responsible for reviewing and verifying AI-generated outputs before relying on them.</li>
            <li><strong>Third-Party Providers:</strong> We use Groq as our AI inference provider. This provider processes your inputs only for the purpose of generating responses to your requests and does not retain your data beyond what is necessary to fulfill that request.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'third-party',
    title: '5. Third-Party Services',
    content: (
      <>
        <p>We use the following third-party service providers to operate and improve our Service:</p>
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-sm text-left text-zinc-700 dark:text-zinc-300">
            <thead className="text-xs text-zinc-500 uppercase border-b border-zinc-800">
              <tr>
                <th className="py-2 pr-4">Provider</th>
                <th className="py-2 pr-4">Purpose</th>
                <th className="py-2">Data Shared</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-zinc-800/50">
                <td className="py-2 pr-4 text-zinc-900 dark:text-white">Supabase</td>
                <td className="py-2 pr-4">Authentication, Database, Storage</td>
                <td className="py-2">Account info, study content, profile</td>
              </tr>
              <tr className="border-b border-zinc-800/50">
                <td className="py-2 pr-4 text-zinc-900 dark:text-white">Groq</td>
                <td className="py-2 pr-4">Primary AI Inference</td>
                <td className="py-2">Prompts and uploaded content</td>
              </tr>
              <tr className="border-b border-zinc-800/50">
                <td className="py-2 pr-4 text-zinc-900 dark:text-white">Stripe</td>
                <td className="py-2 pr-4">Payment Processing</td>
                <td className="py-2">Payment details (we store none)</td>
              </tr>
              <tr className="border-b border-zinc-800/50">
                <td className="py-2 pr-4 text-zinc-900 dark:text-white">PostHog</td>
                <td className="py-2 pr-4">Product Analytics</td>
                <td className="py-2">Usage data, page views, events</td>
              </tr>
              <tr className="border-b border-zinc-800/50">
                <td className="py-2 pr-4 text-zinc-900 dark:text-white">Resend</td>
                <td className="py-2 pr-4">Email Delivery</td>
                <td className="py-2">Email address, transactional data</td>
              </tr>
              <tr className="border-b border-zinc-800/50">
                <td className="py-2 pr-4 text-zinc-900 dark:text-white">Vercel</td>
                <td className="py-2 pr-4">Hosting and Serverless Functions</td>
                <td className="py-2">IP addresses, request metadata</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3">
          Each provider processes your data under its own terms and privacy practices. We ensure that our agreements with these providers restrict them from using your data for their own purposes.
        </p>
      </>
    ),
  },
  {
    id: 'legal-basis',
    title: '6. Legal Basis for Processing (GDPR)',
    content: (
      <>
        <p>If you are located in the European Economic Area (EEA) or the United Kingdom, we process your personal data under the following legal bases:</p>
        <ul className="list-disc pl-5 space-y-1.5 text-zinc-700 dark:text-zinc-300">
          <li><strong>Contract Performance:</strong> To provide the Service you have subscribed to, including AI processing, storage, and study features.</li>
          <li><strong>Consent:</strong> For analytics cookies, marketing communications, and any future use of data for AI model training.</li>
          <li><strong>Legitimate Interests:</strong> To improve the Service, ensure security, and prevent fraud, where our interests do not override your rights.</li>
          <li><strong>Legal Obligation:</strong> To comply with applicable laws and legal requests.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'data-retention',
    title: '7. Data Retention',
    content: (
      <>
        <p>
          We retain your personal data only as long as necessary to fulfill the purposes described in this policy, or as required by law.
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-zinc-700 dark:text-zinc-300">
          <li><strong>Account Data:</strong> Retained for the duration of your account. Upon deletion, data is removed within 30 days.</li>
          <li><strong>Study Content:</strong> Retained until you delete it or close your account.</li>
          <li><strong>AI Interaction Logs:</strong> Anonymized logs may be retained for up to 90 days for service improvement and debugging.</li>
          <li><strong>Analytics Data:</strong> Retained in aggregate, de-identified form for product analysis. Individual-level data is retained per our analytics provider's standard retention.</li>
          <li><strong>Payment Records:</strong> Retained as required by financial regulations (typically 7 years).</li>
          <li><strong>Backup Copies:</strong> Retained for up to 30 days after deletion from active systems.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'your-rights',
    title: '8. Your Rights',
    content: (
      <>
        <p>Depending on your jurisdiction, you may have the following rights regarding your personal data:</p>
        <ul className="list-disc pl-5 space-y-1.5 text-zinc-700 dark:text-zinc-300">
          <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
          <li><strong>Rectification:</strong> Request correction of inaccurate or incomplete data.</li>
          <li><strong>Erasure ("Right to be Forgotten"):</strong> Request deletion of your personal data. You can do this directly in your account settings or by contacting us.</li>
          <li><strong>Data Portability:</strong> Request a machine-readable copy of your data (available as JSON or CSV export from your settings).</li>
          <li><strong>Objection:</strong> Object to processing based on legitimate interests, including analytics.</li>
          <li><strong>Restriction:</strong> Request restriction of processing in certain circumstances.</li>
          <li><strong>Withdraw Consent:</strong> Withdraw consent at any time where processing is based on consent.</li>
          <li><strong>Lodge a Complaint:</strong> File a complaint with your local data protection authority.</li>
        </ul>
        <p className="mt-3">
          To exercise your rights, visit your account settings or contact us at <strong>privacy@auramind.app</strong>. We will respond within 30 days.
        </p>
      </>
    ),
  },
  {
    id: 'gdpr-export',
    title: '9. GDPR Data Export & Deletion',
    content: (
      <>
        <p>
          We provide built-in tools to exercise your GDPR rights:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-zinc-700 dark:text-zinc-300">
          <li><strong>Data Export (Article 20):</strong> Export all your data — including profile, decks, cards, study sessions, and statistics — as JSON or CSV from your account settings.</li>
          <li><strong>Account Deletion (Article 17):</strong> Delete your account and all associated data directly from your settings. Your profile, decks, cards, study history, and uploaded documents will be permanently removed.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'cookies',
    title: '10. Cookies & Tracking',
    content: (
      <>
        <p>
          We use cookies and similar tracking technologies to operate and improve the Service. You can control cookie preferences through our cookie consent banner.
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-zinc-700 dark:text-zinc-300">
          <li><strong>Necessary Cookies:</strong> Required for authentication, session management, and core functionality. Cannot be disabled.</li>
          <li><strong>Analytics Cookies:</strong> Help us understand how you use the Service (PostHog). Disabled by default; enabled only with your consent.</li>
          <li><strong>Preference Cookies:</strong> Remember your settings and preferences.</li>
          <li><strong>Marketing Cookies:</strong> Used only with your explicit consent for relevant content delivery.</li>
        </ul>
        <p className="mt-3">
          You can manage your cookie preferences at any time through the cookie settings in your account or via the cookie banner.
        </p>
      </>
    ),
  },
  {
    id: 'children',
    title: '11. Children & COPPA Compliance',
    content: (
      <>
        <p>
          AuraMind is designed for users aged 13 and above. We do not knowingly collect personal information from children under 13 without verifiable parental consent in accordance with the Children's Online Privacy Protection Act (COPPA).
        </p>
        <p>
          If you believe a child under 13 has provided us with personal data, please contact us immediately at <strong>privacy@auramind.app</strong>. We will take steps to delete such information promptly.
        </p>
        <p>
          Schools using AuraMind in an educational setting must ensure compliance with applicable laws, including COPPA and FERPA. We provide data processing agreements for educational institutions upon request.
        </p>
      </>
    ),
  },
  {
    id: 'security',
    title: '12. Data Security',
    content: (
      <>
        <p>
          We implement industry-standard security measures to protect your data:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-zinc-700 dark:text-zinc-300">
          <li>Encryption in transit (TLS 1.3) for all communications.</li>
          <li>Encryption at rest for stored data.</li>
          <li>Row-Level Security (RLS) policies in our database to ensure data isolation between users.</li>
          <li>Regular security audits and dependency updates.</li>
          <li>Access controls limiting internal access to user data to authorized personnel only.</li>
          <li>Secure API key management — all third-party API keys are stored as environment variables, never exposed to clients.</li>
        </ul>
        <p className="mt-3">
          While we take these precautions seriously, no method of electronic storage or transmission is 100% secure. We cannot guarantee absolute security.
        </p>
      </>
    ),
  },
  {
    id: 'international',
    title: '13. International Data Transfers',
    content: (
      <>
        <p>
          Your data is processed in the United States and may be transferred to other jurisdictions where our service providers operate. When transferring data from the EEA or UK, we ensure appropriate safeguards are in place, including:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-zinc-700 dark:text-zinc-300">
          <li>Standard Contractual Clauses (SCCs) approved by the European Commission.</li>
          <li>Data Processing Agreements (DPAs) with all sub-processors.</li>
          <li>Compliance with applicable data transfer frameworks.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'california',
    title: '14. California Privacy Rights (CCPA/CPRA)',
    content: (
      <>
        <p>
          If you are a California resident, the California Consumer Privacy Act (CCPA) as amended by the CPRA provides you with additional rights:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-zinc-700 dark:text-zinc-300">
          <li><strong>Right to Know:</strong> Request disclosure of categories and specific pieces of personal information collected.</li>
          <li><strong>Right to Delete:</strong> Request deletion of personal information we have collected.</li>
          <li><strong>Right to Opt-Out:</strong> We do not sell your personal information. As defined by the CCPA, we do not share data for cross-context behavioral advertising.</li>
          <li><strong>Right to Non-Discrimination:</strong> We will not discriminate against you for exercising your CCPA rights.</li>
        </ul>
        <p className="mt-3">
          To exercise your California rights, contact us at <strong>privacy@auramind.app</strong>.
        </p>
      </>
    ),
  },
  {
    id: 'changes',
    title: '15. Changes to This Policy',
    content: (
      <>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of material changes via email or through the Service. Your continued use after changes take effect constitutes acceptance of the updated policy.
        </p>
        <p>
          We review this policy at least quarterly and update it whenever we add new AI features, change providers, or modify data handling practices.
        </p>
        <p className="text-zinc-600 dark:text-zinc-400">
          Last updated: May 27, 2026
        </p>
      </>
    ),
  },
  {
    id: 'contact',
    title: '16. Contact Us',
    content: (
      <>
        <p>
          If you have questions about this Privacy Policy or our data practices, please contact us:
        </p>
        <ul className="list-none space-y-1 text-zinc-700 dark:text-zinc-300">
          <li><strong>Email:</strong> privacy@auramind.app</li>
          <li><strong>Data Protection:</strong> dpo@auramind.app</li>
          <li><strong>Address:</strong> AuraMind, Inc., 548 Market St, San Francisco, CA 94104</li>
        </ul>
      </>
    ),
  },
];

export default function PrivacyPolicyPage(): React.ReactElement {
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link
            to="/"
            className="p-2 -ml-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-zinc-900 dark:text-white">Privacy Policy</h1>
            <p className="text-xs text-zinc-500">Last updated: May 27, 2026</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="space-y-10">
          {sections.map((section) => (
            <section key={section.id} id={section.id}>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">{section.title}</h2>
              <div className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed space-y-3">
                {section.content}
              </div>
            </section>
          ))}
        </div>

        {/* Back to home */}
        <div className="mt-12 pt-8 border-t border-zinc-800 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to AuraMind
          </Link>
        </div>
      </div>
    </div>
  );
}



