import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from '@/components/icons';
import {
  PARENT_COMPANY_NAME,
  PARENT_COMPANY_LEGAL,
  PARENT_BRAND_SLUG,
  PARENT_BRAND_TAGLINE,
  PARENT_BYLINE_SHORT,
  PRODUCT_BYLINE,
  CONTACT_EMAIL,
  LEGAL_COPYRIGHT_LINE,
} from '../../lib/branding';

/**
 * Footer for legal/public pages carrying the CogniVect parent-company brand
 * attribution.
 *
 * Mounted on Privacy Policy + Terms of Service + any future public/marketing
 * page that doesn't sit behind the dashboard chrome. The dashboard's own
 * sidebar already carries the product brand; we don't double up.
 *
 *   - Single-line copy that names the parent brand WITHOUT crowding the
 *     page (per the v1 architecture call: don't touch splash/login, do touch
 *     legal/footer for transparent corporate attribution).
 *   - Inline link to /about reveals the longer parent-company rationale if
 *     the product grows that page in the future.
 *   - "by CogniVect" wording follows the consumer-friendly industry pattern
 *     (e.g. "Instagram from Meta" / "WhatsApp from Meta") so the parent
 *     brand surfaces without diluting the product's identity.
 *
 * Source of every piece of copy: the brand-config module under src/lib/.
 * When PARENT_COMPANY_NAME changes (rare), this footer updates for free.
 */
interface CogniVectFooterProps {
  /** Override the link target for the "About CogniVect" anchor. */
  aboutHref?: string;
  /** When true, render only the corporate line (for tight footers). */
  compact?: boolean;
}

export const CogniVectFooter: React.FC<CogniVectFooterProps> = ({
  aboutHref = '/about',
  compact = false,
}) => {
  return (
    <div className="mt-10 pt-6 border-t border-[#2A2A3A]/30">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-[11px] text-[#5A5A72] leading-relaxed">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[#9090A8]">{PRODUCT_BYLINE}</span>
            <span className="text-[#5A5A72]">·</span>
            <span className="text-[#5A5A72]">{PARENT_BYLINE_SHORT}</span>
            <span className="text-[#5A5A72] opacity-60">·</span>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-[#5A5A72] hover:text-[#9090A8] underline-offset-2 hover:underline"
            >
              {CONTACT_EMAIL}
            </a>
          </div>
          {!compact && (
            <div className="text-[#5A5A72] mt-0.5">
              <Link
                to={aboutHref}
                className="inline-flex items-center gap-1 underline-offset-2 hover:text-[#9090A8] hover:underline"
              >
                About {PARENT_COMPANY_NAME}
                <ArrowUpRight size={10} />
              </Link>
              <span className="text-[#3A3A4F] mx-2">·</span>
              <span className="text-[#3A3A4F] font-mono text-[10px]">
                /{PARENT_BRAND_SLUG} — {PARENT_BRAND_TAGLINE}
              </span>
              <span className="text-[#3A3A4F] mx-2">·</span>
              <span className="text-[#3A3A4F] text-[10px]">
                {PARENT_COMPANY_LEGAL}
              </span>
            </div>
          )}
        </div>
        <div className="text-[10px] text-[#3A3A4F]">{LEGAL_COPYRIGHT_LINE}</div>
      </div>
    </div>
  );
};

export default CogniVectFooter;
