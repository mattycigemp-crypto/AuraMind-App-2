/**
 * AdminShell — minimal two-page admin layout: Users + App Check.
 *
 * Wraps the admin routes in a slim top bar with two nav links plus a
 * "Back to Dashboard" escape hatch. Role-gating happens one level up in
 * App.tsx (only admins reach /admin/* at all).
 */
import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Users, ClipboardCheck, ArrowLeft, ShieldCheck } from '@/components/icons';

const linkBase =
  'inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11px] font-medium transition-colors';
const activeLink = 'bg-[#7C3AED]/20 border border-[#7C3AED]/40 text-[#8B5CF6]';
const idleLink = 'bg-[#111118] border border-[#2A2A3A] text-[#7A7A96] hover:text-[#F0EFFE] hover:border-[#3A3A4F]';

export default function AdminShell() {
  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-[#2A2A3A]/50 bg-[#0A0A0F]/85 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#F0EFFE] text-sm font-medium tracking-tight">
            <ShieldCheck className="w-4 h-4 text-[#8B5CF6]" />
            AuraMind Admin
          </div>

          <nav className="flex items-center gap-2">
            <NavLink to="/admin/users" className={({ isActive }) => `${linkBase} ${isActive ? activeLink : idleLink}`}>
              <Users className="w-3.5 h-3.5" /> Users
            </NavLink>
            <NavLink to="/admin/check" className={({ isActive }) => `${linkBase} ${isActive ? activeLink : idleLink}`}>
              <ClipboardCheck className="w-3.5 h-3.5" /> App Check
            </NavLink>
            <NavLink to="/dashboard" className={`${linkBase} ${idleLink}`}>
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </NavLink>
          </nav>
        </div>
      </header>

      {/* Route content */}
      <main className="max-w-6xl mx-auto px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
