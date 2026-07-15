import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  DownloadIcon as Download,
  MonitorIcon as Monitor,
  SmartphoneIcon as Smartphone,
  CheckCircle2Icon as CheckCircle2,
  ArrowRightIcon as ArrowRight,
  ExternalLinkIcon as ExternalLink,
  MailIcon as Mail,
} from '../components/icons/CustomIcons';
import { TechGridBackground, GridDotPattern } from '../components/landing/TechGridBackground';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: <Monitor size={24} className="text-primary" />,
    title: 'Native Performance',
    description: 'Built with Tauri v2 + Rust for lightning-fast startup and minimal memory usage.',
  },
  {
    icon: <Smartphone size={24} className="text-primary" />,
    title: 'Mobile Optimized',
    description: 'Capacitor-powered iOS & Android apps with native haptics, biometrics & push notifications.',
  },
  {
    icon: <CheckCircle2 size={24} className="text-primary" />,
    title: 'Offline First',
    description: 'Study anywhere — full offline support with background sync when you reconnect.',
  },
  {
    icon: <Download size={24} className="text-primary" />,
    title: 'Auto Updates',
    description: 'Seamless background updates — always on the latest version without manual downloads.',
  },
];

const platformButtons = [
  {
    label: 'Windows',
    subtitle: '.msi / .exe installer — Windows 10+',
    icon: <Monitor size={22} />,
    href: 'https://github.com/mattycigemp-crypto/AuraMind-App-2/releases/latest',
    directDownload: 'https://github.com/mattycigemp-crypto/AuraMind-App-2/releases/latest/download/AuraMind_2.0.0_x64_en-US.msi',
    variant: 'primary',
  },
  {
    label: 'macOS',
    subtitle: '.dmg — Apple Silicon & Intel',
    icon: (
      <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.33 18.53A10.24 10.24 0 0 0 16 2H6a6 6 0 0 0-6 6v2.5" />
        <path d="M14 2v20" />
        <path d="M18 6v14" />
        <path d="M10 2v18" />
        <path d="M22 18h-4" />
        <path d="M2 18h20" />
      </svg>
    ),
    href: 'https://github.com/mattycigemp-crypto/AuraMind-App-2/releases/latest',
    directDownload: 'https://github.com/mattycigemp-crypto/AuraMind-App-2/releases/latest/download/AuraMind_2.0.0_aarch64.dmg',
    variant: 'secondary',
  },
  {
    label: 'Linux',
    subtitle: '.AppImage / .deb / .rpm',
    icon: <Monitor size={22} />,
    href: 'https://github.com/mattycigemp-crypto/AuraMind-App-2/releases/latest',
    directDownload: 'https://github.com/mattycigemp-crypto/AuraMind-App-2/releases/latest/download/AuraMind_2.0.0_amd64.AppImage',
    variant: 'secondary',
  },
];

const mobilePlatforms = [
  {
    label: 'iOS',
    subtitle: 'App Store — submit for review',
    icon: (
      <svg width={22} height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
      </svg>
    ),
    href: 'https://apps.apple.com',
    external: true,
    disabled: true,
  },
  {
    label: 'Android',
    subtitle: 'Google Play — submit for review',
    icon: (
      <svg width={22} height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.33,0-6-2.67-6-6s2.67-6,6-6c1.663,0,3.145,0.688,4.212,1.775L13.81,5.504C12.451,4.465,10.873,4,9.245,4C5.555,4,2.592,6.896,2.592,10.539c0,3.831,3.152,6.734,6.901,6.734h0.144c0.303,0,0.604-0.027,0.902-0.082v-4.257H9.245v-2.31h2.656v-1.865c0-2.178,1.37-3.293,3.114-3.293h1.912V10.239z"/>
      </svg>
    ),
    href: 'https://play.google.com/store',
    external: true,
    disabled: true,
  },
];

const DownloadPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TechGridBackground />
      <GridDotPattern />

      {/* Hero Section */}
      <section className="relative z-10 min-h-[70vh] flex items-center justify-center px-6 md:px-12">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
              <Download size={16} />
              Native Apps Now Available
            </span>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8 leading-none">
              Download
              <br />
              <span className="text-primary">AuraMind</span>
              <span className="text-zinc-500">.</span>
            </h1>
            <p className="text-lg md:text-xl text-zinc-400 mb-12 max-w-2xl mx-auto leading-relaxed">
              Experience the full power of AuraMind with native desktop and mobile apps.
              Faster startup, offline study, native notifications, and platform integrations.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link
                to="/auth"
                className="group inline-flex items-center gap-3 px-10 py-5 bg-primary text-black font-bold text-base uppercase tracking-wider hover:bg-primary/90 transition-all duration-300"
              >
                Get Started Free
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Platform Download Section */}
      <section id="windows" className="relative z-10 py-24 md:py-32 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
                Desktop Apps
              </h2>
              <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
                Native Windows, macOS, and Linux apps built with Tauri v2 — 
                smaller, faster, and more secure than Electron.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {platformButtons.map((platform, index) => (
                <motion.div
                  key={platform.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="relative h-full bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 md:p-10 transition-all hover:border-primary/50 hover:bg-zinc-900">
                    <div className="flex items-start gap-4 mb-6">
                      <div className="shrink-0 w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                        {platform.icon}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-foreground">{platform.label}</h3>
                        <p className="text-zinc-500 mt-1">{platform.subtitle}</p>
                      </div>
                    </div>

                    <ul className="space-y-3 mb-8">
                      <li className="flex items-center gap-3 text-zinc-300">
                        <CheckCircle2 size={18} className="text-primary shrink-0" />
                        Native performance with Rust backend
                      </li>
                      <li className="flex items-center gap-3 text-zinc-300">
                        <CheckCircle2 size={18} className="text-primary shrink-0" />
                        Offline-first with background sync
                      </li>
                      <li className="flex items-center gap-3 text-zinc-300">
                        <CheckCircle2 size={18} className="text-primary shrink-0" />
                        System tray & native notifications
                      </li>
                      <li className="flex items-center gap-3 text-zinc-300">
                        <CheckCircle2 size={18} className="text-primary shrink-0" />
                        Auto-updates (MSI/NSIS on Windows)
                      </li>
                    </ul>

                    <a
                      href={platform.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-black font-bold rounded-xl hover:bg-primary/90 transition-colors"
                    >
                      <Download size={18} />
                      Download for {platform.label}
                    </a>
                    <p className="text-center text-[10px] text-zinc-600 mt-3">
                      Opens GitHub Releases — pick the latest version for your OS.
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mobile Section */}
      <section id="mobile" className="relative z-10 py-24 md:py-32 px-6 md:px-12 bg-zinc-900/30 border-y border-zinc-800">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
                Mobile Apps
              </h2>
              <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
                Native iOS & Android apps with Capacitor — haptics, biometrics, push notifications, and more.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {mobilePlatforms.map((platform, index) => (
                <motion.div
                  key={platform.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className={`relative h-full bg-zinc-900/50 border rounded-2xl p-8 md:p-10 transition-all ${
                    platform.disabled 
                      ? 'border-zinc-800 opacity-60' 
                      : 'border-primary/20 hover:border-primary/50'
                  }`}>
                    <div className="flex items-start gap-4 mb-6">
                      <div className="shrink-0 w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                        {platform.icon}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-foreground">{platform.label}</h3>
                        <p className="text-zinc-500 mt-1">{platform.subtitle}</p>
                      </div>
                    </div>

                    <ul className="space-y-3 mb-8">
                      <li className="flex items-center gap-3 text-zinc-300">
                        <CheckCircle2 size={18} className="text-primary shrink-0" />
                        Native haptics & biometrics (FaceID/TouchID)
                      </li>
                      <li className="flex items-center gap-3 text-zinc-300">
                        <CheckCircle2 size={18} className="text-primary shrink-0" />
                        Push notifications for study reminders
                      </li>
                      <li className="flex items-center gap-3 text-zinc-300">
                        <CheckCircle2 size={18} className="text-primary shrink-0" />
                        Safe-area insets for Dynamic Island/home indicator
                      </li>
                      <li className="flex items-center gap-3 text-zinc-300">
                        <CheckCircle2 size={18} className="text-primary shrink-0" />
                        Filesystem access & share sheet integration
                      </li>
                    </ul>

                    {platform.disabled ? (
                      <a
                        href="mailto:auramind-app@googlegroups.com?subject=Notify me when AuraMind mobile launches&body=I want to be notified when the AuraMind native mobile app is available on iOS/Android."
                        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-zinc-800 border border-zinc-700 text-zinc-300 font-medium rounded-xl hover:bg-primary hover:text-black transition-colors"
                      >
                        <Mail size={18} />
                        Notify Me
                      </a>
                    ) : (
                      <a
                        href={platform.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-black font-bold rounded-xl hover:bg-primary/90 transition-colors"
                      >
                        <ExternalLink size={18} />
                        Open Store
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Waitlist CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-12 text-center"
            >
              <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-zinc-800/50 border border-zinc-700/50">
                <Mail size={20} className="text-primary shrink-0" />
                <p className="text-zinc-300">
                  Native mobile apps are in final review.{' '}
                  <a
                    href="mailto:auramind-app@googlegroups.com?subject=Notify me when AuraMind mobile launches&body=I want to be notified when the AuraMind native mobile app is available on iOS/Android."
                    className="text-primary hover:underline font-medium"
                  >
                    Join the waitlist to get notified.
                  </a>
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Publishing Checklist */}
      <section className="relative z-10 py-24 md:py-32 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
                Publishing Checklist
              </h2>
              <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
                What&apos;s needed before native mobile apps go live on the App Store and Google Play.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* iOS Checklist */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 md:p-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <svg width={22} height="22" viewBox="0 0 24 24" fill="currentColor" className="text-primary">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">iOS — App Store</h3>
                    <p className="text-zinc-500">Apple Developer Program ($99/yr)</p>
                  </div>
                </div>
                <ul className="space-y-4">
                  {[
                    'Apple Developer account enrollment ($99/year)',
                    'App Store Connect setup & team invite',
                    'App icon (all sizes: 1024×1024 + device-specific)',
                    'Screenshots: 6.7″ (iPhone 15 Pro Max) & 12.9″ (iPad Pro)',
                    'App preview video (optional, recommended)',
                    'Privacy policy URL (hosted on auramind.app/privacy)',
                    'App description, keywords, and support URL',
                    'Export Compliance (Crypto: YES — uses encryption)',
                    'TestFlight internal & external testing (1–3 days)',
                    'App Review submission (24–48 hours typical)',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-zinc-300">
                      <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Android Checklist */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 md:p-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <svg width={22} height="22" viewBox="0 0 24 24" fill="currentColor" className="text-primary">
                      <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.33,0-6-2.67-6-6s2.67-6,6-6c1.663,0,3.145,0.688,4.212,1.775L13.81,5.504C12.451,4.465,10.873,4,9.245,4C5.555,4,2.592,6.896,2.592,10.539c0,3.831,3.152,6.734,6.901,6.734h0.144c0.303,0,0.604-0.027,0.902-0.082v-4.257H9.245v-2.31h2.656v-1.865c0-2.178,1.37-3.293,3.114-3.293h1.912V10.239z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Android — Google Play</h3>
                    <p className="text-zinc-500">Google Play Console ($25 one-time)</p>
                  </div>
                </div>
                <ul className="space-y-4">
                  {[
                    'Google Play Developer account ($25 one-time fee)',
                    'Create or link Google Pay Merchant account (paid app or IAP)',
                    'Production keystore generation & backup (see scripts/)',
                    'App icon (512×512 + 1024×1024 adaptive icon)',
                    'Feature graphic (1024×500) & screenshots (phone + tablet)',
                    'Store listing: title (30 chars), short desc (80), full desc (4000)',
                    'Privacy policy URL (hosted on auramind.app/privacy)',
                    'Content rating questionnaire (IARC)',
                    'App releases → Production track: rollout % → 100%',
                    'In-app review & in-app update APIs integration',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-zinc-300">
                      <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-12 text-center">
              <p className="text-zinc-500 text-sm">
                See{' '}
                <a
                  href="https://github.com/mattycigemp-crypto/AuraMind-App-2/blob/main/auramind-gemini/scripts/README-MOBILE-PUBLISHING.md"
                  className="text-primary hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  scripts/README-MOBILE-PUBLISHING.md
                </a>{' '}
                for the full step-by-step publishing guide.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-24 md:py-32 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
                Why Go Native?
              </h2>
              <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
                The web app is great, but native apps unlock the full AuraMind experience.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 md:p-8 h-full transition-all hover:border-primary/50 hover:bg-zinc-900/50">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                    <p className="text-zinc-400 leading-relaxed">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24 md:py-32 px-6 md:px-12">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 md:p-16 overflow-hidden">
              <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(99, 102, 241, 0.5) 2px, rgba(99, 102, 241, 0.5) 4px)' }} />
              
              <div className="relative z-10">
                <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-6">
                  Ready to Study Smarter?
                </h2>
                <p className="text-lg text-zinc-400 mb-10 max-w-xl mx-auto">
                  Start on the web, upgrade to native anytime. Your data syncs seamlessly.
                </p>
                <Link
                  to="/auth"
                  className="inline-flex items-center gap-3 px-10 py-5 bg-primary text-black font-bold text-base uppercase tracking-wider hover:bg-primary/90 transition-all duration-300"
                >
                  Get Started Free
                  <ArrowRight size={20} />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <div className="text-xl font-black tracking-tight text-foreground mb-2">
                AURAMIND
              </div>
              <p className="text-sm text-zinc-500">
                © 2026 AuraMind. All rights reserved.
              </p>
            </div>

            <div className="flex items-center gap-6">
              <Link to="/download" className="text-zinc-500 hover:text-foreground transition-colors text-sm font-medium">
                Download Apps
              </Link>
              <Link to="/privacy" className="text-zinc-500 hover:text-foreground transition-colors text-sm">Privacy</Link>
              <Link to="/terms" className="text-zinc-500 hover:text-foreground transition-colors text-sm">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DownloadPage;