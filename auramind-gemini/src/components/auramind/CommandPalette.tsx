import {
  Sparkles,
  Home,
  LayoutDashboard,
  Brain,
  MessageSquare,
  Shield,
  Activity,
  Settings,
  LogIn,
  Keyboard,
  Users,
  CreditCard,
  UserPlus,
  FileText,
  Monitor,
  Database,
  ScrollText,
  DollarSign,
  Wrench,
  Key,
  Globe,
} from "@/components/icons";
import { useAuraMind } from "@/lib/auramind/store";
import type { ViewKey } from "@/lib/auramind/types";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDashboardWorkspace } from "@/contexts/DashboardWorkspaceContext";
import { isAdminOrHigher } from "@/utils/permissions";

const NAV_ITEMS: {
  key: ViewKey;
  label: string;
  icon: typeof Home;
  hint: string;
  path: string;
}[] = [
  { key: "landing", label: "Landing Page", icon: Home, hint: "Marketing site", path: "/" },
  { key: "auth", label: "Auth (Login / Signup)", icon: LogIn, hint: "Authentication", path: "/auth" },
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, hint: "Your study home", path: "/dashboard" },
  { key: "study", label: "Study Mode", icon: Brain, hint: "Flashcard review", path: "/dashboard" },
  { key: "chat", label: "Ask Aura (AI Tutor)", icon: MessageSquare, hint: "Chat with Aura", path: "/dashboard/chat" },
  { key: "settings", label: "Settings", icon: Settings, hint: "Preferences", path: "/dashboard/settings" },
];

const ADMIN_PALETTE_ITEMS: {
  key: ViewKey;
  label: string;
  icon: typeof Home;
  hint: string;
  path: string;
}[] = [
  { key: "admin", label: "Admin Overview", icon: Shield, hint: "Launch cockpit", path: "/admin/vault" },
  { key: "users", label: "User Management", icon: Users, hint: "User registry", path: "/admin/users" },
  { key: "subscriptions", label: "Subscriptions", icon: CreditCard, hint: "Plan distribution", path: "/admin/subscriptions" },
  { key: "test-users", label: "Test Users", icon: UserPlus, hint: "Sandbox accounts", path: "/admin/test-users" },
  { key: "content", label: "Content Library", icon: FileText, hint: "Knowledge base stats", path: "/admin/content" },
  { key: "flags", label: "Feature Flags", icon: Activity, hint: "Toggle features", path: "/admin/flags" },
  { key: "database", label: "SQL Explorer", icon: Database, hint: "Query console", path: "/admin/database" },
  { key: "audit", label: "Audit Trail", icon: ScrollText, hint: "Activity log", path: "/admin/audit" },
  { key: "preview", label: "Device Lab", icon: Monitor, hint: "Platform preview", path: "/admin/preview" },
  { key: "health", label: "Health Check", icon: Activity, hint: "Readiness scanner", path: "/admin/health" },
  { key: "revenue", label: "Revenue Dashboard", icon: DollarSign, hint: "MRR & analytics", path: "/admin/revenue" },
  { key: "config", label: "System Config", icon: Wrench, hint: "Platform settings", path: "/admin/config" },
  { key: "roles", label: "Role Manager", icon: Key, hint: "Permission matrix", path: "/admin/roles" },
  { key: "nexus", label: "Nexus Command", icon: Globe, hint: "Classified intelligence", path: "/admin/nexus" },
];

export function CommandPalette() {
  const { cmdOpen, setCmdOpen } = useAuraMind();
  const navigate = useNavigate();
  const workspace = useDashboardWorkspace();

  const filteredNavItems = useMemo(() => {
    return isAdminOrHigher(workspace?.user?.role) ? [...NAV_ITEMS, ...ADMIN_PALETTE_ITEMS] : NAV_ITEMS;
  }, [workspace?.user?.role]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen(!cmdOpen);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cmdOpen, setCmdOpen]);

  const go = (v: ViewKey) => {
    const item = filteredNavItems.find((n) => n.key === v);
    if (item) navigate(item.path);
    setCmdOpen(false);
  };

  return (
    <CommandDialog open={cmdOpen} onOpenChange={setCmdOpen}>
      <CommandInput placeholder="Search pages, actions..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Pages">
          {filteredNavItems.map((item) => (
            <CommandItem
              key={item.key}
              value={`${item.label} ${item.hint}`}
              onSelect={() => go(item.key)}
              className="gap-2"
            >
              <item.icon className="h-4 w-4 text-violet-400" />
              <span>{item.label}</span>
              <span className="ml-auto text-xs text-[#7A7A96]">{item.hint}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Quick actions">
          <CommandItem onSelect={() => go("study")} className="gap-2">
            <Sparkles className="h-4 w-4 text-violet-400" />
            <span>Start today&apos;s review</span>
          </CommandItem>
          <CommandItem onSelect={() => go("chat")} className="gap-2">
            <MessageSquare className="h-4 w-4 text-violet-400" />
            <span>Ask Aura about a card</span>
          </CommandItem>
          {isAdminOrHigher(workspace?.user?.role) && (
            <CommandItem onSelect={() => go("health")} className="gap-2">
              <Activity className="h-4 w-4 text-violet-400" />
              <span>Run readiness scan</span>
            </CommandItem>
          )}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Shortcuts">
          <CommandItem className="gap-2 opacity-60">
            <Keyboard className="h-4 w-4" />
            <span>Press</span>
            <kbd className="ml-auto rounded border border-[#2A2A3A] bg-[#1A1A24] px-1.5 py-0.5 text-[10px]">
              ⌘K
            </kbd>
            <span className="text-xs text-[#7A7A96]">anytime to open this palette</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
