import { useNavigate } from "react-router-dom";
import { ArrowRight, BookOpen, Check, Clock3, ShieldCheck, Sparkles } from "@/components/icons";

const PRINCIPLES = [
  {
    label: "Bring one thing",
    detail: "A topic, document, video, or voice memo.",
    icon: BookOpen,
  },
  {
    label: "Review at the right time",
    detail: "A short queue shaped around your memory.",
    icon: Clock3,
  },
  {
    label: "Keep your attention",
    detail: "No feed, no noisy dashboard, no busywork.",
    icon: ShieldCheck,
  },
] as const;

/**
 * The installed app's entry point. This is a product invitation rather than
 * a shrunken marketing landing page: one promise, a concrete three-step model,
 * and an explicit route into authentication.
 */
export default function AndroidWelcomeScreen() {
  const navigate = useNavigate();

  return (
    <main className="android-welcome-screen" data-testid="android-welcome-screen">
      <div className="android-welcome-content">
        <header className="android-welcome-brand">
          <span className="android-welcome-brand-mark">
            <img src="/favicons,logos/favicon.svg" alt="" aria-hidden="true" />
          </span>
          <span>
            <strong>AuraMind</strong>
            <small>PRISM STUDY SYSTEM</small>
          </span>
        </header>

        <section className="android-welcome-hero" aria-labelledby="android-welcome-title">
          <div className="android-welcome-visual" aria-label="The AuraMind Prism mark">
            <span className="android-welcome-visual-label">A QUIET PLACE TO RECALL</span>
            <div className="android-welcome-prism" aria-hidden="true">
              <img src="/favicons,logos/favicon.svg" alt="" />
              <span />
            </div>
            <div className="android-welcome-visual-meta">
              <span>FOCUS</span>
              <span>RECALL</span>
              <span>MOMENTUM</span>
            </div>
          </div>

          <div className="android-welcome-copy">
            <p className="android-welcome-eyebrow">START WITH ONE SMALL SESSION</p>
            <h1 id="android-welcome-title">
              Remember what matters, <span>without the noise.</span>
            </h1>
            <p>
              AuraMind turns the material you already have into a focused review queue, then gets
              out of the way so you can think.
            </p>
          </div>
        </section>

        <section className="android-welcome-benefits" aria-label="How AuraMind works">
          {PRINCIPLES.map(({ label, detail, icon: Icon }, index) => (
            <div key={label} className="android-welcome-benefit">
              <span className="android-welcome-step">0{index + 1}</span>
              <span className="android-welcome-benefit-icon">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span>
                <strong>{label}</strong>
                <small>{detail}</small>
              </span>
              <Check className="android-welcome-check" aria-hidden />
            </div>
          ))}
        </section>

        <div className="android-welcome-actions">
          <button
            type="button"
            className="android-welcome-primary"
            onClick={() => navigate("/auth")}
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            Start with a free account
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            className="android-welcome-secondary"
            onClick={() => navigate("/auth?mode=login")}
          >
            Already have an account <span>Sign in</span>
          </button>
        </div>

        <p className="android-welcome-footnote">
          Your preferences can change later · No credit card to begin
        </p>
      </div>
    </main>
  );
}
