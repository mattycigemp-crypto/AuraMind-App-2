import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Flame, Settings } from "@/components/icons";
import { useAppPreference } from "../../lib/appPreferences";
import type { UserProfile } from "../../types";

function pageTitle(pathname: string): string {
  if (pathname === "/dashboard") return "Today";
  if (pathname.startsWith("/dashboard/decks")) return "Library";
  if (pathname.startsWith("/dashboard/study")) return "Study";
  if (pathname.startsWith("/dashboard/chat")) return "Prof. Aura";
  if (pathname.startsWith("/dashboard/generator")) return "Create";
  if (pathname.startsWith("/dashboard/settings")) return "Settings";
  return "AuraMind";
}

function initials(user: UserProfile | null | undefined): string {
  return (
    user?.name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "AM"
  );
}

export function AndroidMobileTopBar({ user }: { user: UserProfile | null | undefined }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [offlineMode] = useAppPreference("auramind_offlineMode", false);

  return (
    <header className="android-mobile-topbar" role="banner">
      <div className="android-mobile-brand">
        <span className="android-mobile-brand-mark">
          <img src="/favicons,logos/favicon.svg" alt="" aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="android-mobile-brand-name">AuraMind</span>
          <span className="android-mobile-page-title">{pageTitle(location.pathname)}</span>
        </span>
      </div>
      <div className="android-mobile-top-actions">
        {offlineMode && (
          <span className="android-top-offline" aria-label="Offline mode is on">
            Offline
          </span>
        )}
        <span className="android-top-streak" aria-label={`${user?.streak ?? 0} day streak`}>
          <Flame className="h-4 w-4" aria-hidden />
          {user?.streak ?? 0}
        </span>
        <button
          type="button"
          className="android-top-icon"
          onClick={() => navigate("/dashboard/settings")}
          aria-label="Open settings"
        >
          <Settings className="h-5 w-5" aria-hidden />
        </button>
        <button
          type="button"
          className="android-avatar"
          onClick={() => navigate("/dashboard/settings")}
          aria-label={`Open ${user?.name ?? "account"} settings`}
        >
          {initials(user)}
        </button>
      </div>
    </header>
  );
}

export default AndroidMobileTopBar;
