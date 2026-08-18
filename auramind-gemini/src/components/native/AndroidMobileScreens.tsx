import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Brain,
  Check,
  ChevronRight,
  Clock,
  Flame,
  Layers,
  MessageCircle,
  Mic,
  Pencil,
  Play,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from "@/components/icons";
import { useDashboardWorkspace } from "../../contexts/DashboardWorkspaceContext";
import type { Card, Deck } from "../../types";
import { toast } from "sonner";

function startOfToday(): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.getTime();
}

function deckCards(deck: Deck, cards: Card[]): Card[] {
  return cards.filter((card) => card.deckId === deck.id);
}

function deckProgress(deck: Deck, cards: Card[]): number {
  const items = deckCards(deck, cards);
  if (items.length === 0) return 0;
  return Math.round(
    (items.filter((card) => (card.repetition ?? 0) > 0).length / items.length) * 100,
  );
}

function deckDue(deck: Deck, cards: Card[]): number {
  return deckCards(deck, cards).filter((card) => (card.nextReview ?? 0) <= Date.now()).length;
}

function AndroidScreenHeader({
  eyebrow,
  title,
  detail,
  action,
}: {
  eyebrow: string;
  title: string;
  detail?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="android-screen-header">
      <div className="min-w-0">
        <p className="android-eyebrow">{eyebrow}</p>
        <h1 className="android-screen-title">{title}</h1>
        {detail && <p className="android-screen-detail">{detail}</p>}
      </div>
      {action}
    </div>
  );
}

function AndroidAction({
  label,
  hint,
  icon: Icon,
  tone,
  onClick,
}: {
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "violet" | "cyan" | "pink";
  onClick: () => void;
}) {
  return (
    <button type="button" className={`android-action android-action-${tone}`} onClick={onClick}>
      <span className="android-action-icon">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 text-left">
        <span className="android-action-label">{label}</span>
        <span className="android-action-hint">{hint}</span>
      </span>
    </button>
  );
}

function AndroidDeckRow({
  deck,
  cards,
  onStudy,
  onEdit,
  onDelete,
}: {
  deck: Deck;
  cards: Card[];
  onStudy: () => void;
  onEdit: () => void;
  onDelete?: () => void;
}) {
  const items = deckCards(deck, cards);
  const due = deckDue(deck, cards);
  const progress = deckProgress(deck, cards);

  return (
    <article className="android-deck-row">
      <button type="button" className="android-deck-main" onClick={onStudy}>
        <span className="android-deck-icon">
          <BookOpen className="h-5 w-5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1 text-left">
          <span className="android-deck-title">{deck.title}</span>
          <span className="android-deck-meta">
            {items.length} cards · {progress}% explored
          </span>
          <span className="android-progress-track" aria-label={`${progress}% explored`}>
            <span className="android-progress-value" style={{ width: `${progress}%` }} />
          </span>
        </span>
        <span className="android-deck-status">
          {due > 0 ? (
            <span className="android-due-badge">{due} due</span>
          ) : (
            <Check className="h-4 w-4 text-emerald-300" aria-label="All reviewed" />
          )}
          <ChevronRight className="h-4 w-4 text-slate-500" aria-hidden />
        </span>
      </button>
      <div className="android-deck-actions">
        <button type="button" onClick={onStudy}>
          <Play className="h-3.5 w-3.5 fill-current" aria-hidden />
          Study
        </button>
        <button type="button" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" aria-hidden />
          Edit
        </button>
        {onDelete && (
          <button
            type="button"
            className="android-deck-delete"
            onClick={onDelete}
            aria-label={`Delete ${deck.title}`}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
          </button>
        )}
      </div>
    </article>
  );
}

export function AndroidOverview() {
  const navigate = useNavigate();
  const workspace = useDashboardWorkspace();
  const { user, decks, cards, startQuickStudy, startStudyForDeck } = workspace!;
  const today = startOfToday();
  const dueCount = cards.filter((card) => (card.nextReview ?? 0) <= Date.now()).length;
  const studiedToday = cards.filter((card) => (card.lastReviewed ?? 0) >= today).length;
  const mastered = cards.filter(
    (card) => (card.repetition ?? 0) >= 3 && (card.lapses ?? 0) === 0,
  ).length;
  const firstName = user?.name?.split(" ")[0] || "Learner";
  const firstDueDeck = decks.find((deck) => deckDue(deck, cards) > 0) ?? decks[0];
  const greeting =
    new Date().getHours() < 12
      ? "Good morning"
      : new Date().getHours() < 18
        ? "Good afternoon"
        : "Good evening";

  return (
    <div className="android-screen android-home-screen">
      <div className="android-greeting-block">
        <p className="android-eyebrow">
          {greeting}, {firstName}
        </p>
        <h1 className="android-hero-title">
          Make today
          <br />
          <span>count.</span>
        </h1>
        <p className="android-hero-copy">
          {dueCount > 0
            ? `${dueCount} cards are ready when you are.`
            : "Your memory queue is clear. Build a little more mastery."}
        </p>
      </div>

      <section className="android-focus-card">
        <div className="android-focus-orb" aria-hidden />
        <div className="relative z-10">
          <div className="flex items-center justify-between gap-3">
            <span className="android-focus-label">
              <span className="android-live-dot" /> TODAY&apos;S FOCUS
            </span>
            <span className="android-streak-pill">
              <Flame className="h-3.5 w-3.5" aria-hidden /> {user?.streak ?? 0} day streak
            </span>
          </div>
          <div className="mt-5 flex items-end justify-between gap-4">
            <div>
              <p className="android-focus-number">{dueCount}</p>
              <p className="android-focus-caption">cards waiting for review</p>
            </div>
            <button
              type="button"
              className="android-primary-button"
              onClick={() => (firstDueDeck ? startQuickStudy() : navigate("/dashboard/decks"))}
            >
              <Play className="h-4 w-4 fill-current" aria-hidden />
              {firstDueDeck ? "Start review" : "Create a deck"}
            </button>
          </div>
          <div className="android-focus-footer">
            <span>
              <Clock className="h-3.5 w-3.5" aria-hidden /> About{" "}
              {Math.max(2, Math.ceil(dueCount * 0.6))} min
            </span>
            <span>{studiedToday} reviewed today</span>
          </div>
        </div>
      </section>

      <section>
        <div className="android-section-heading">
          <h2>Quick actions</h2>
          <span>One tap away</span>
        </div>
        <div className="android-action-grid">
          <AndroidAction
            label="Generate"
            hint="Turn anything into cards"
            icon={Sparkles}
            tone="violet"
            onClick={() => navigate("/dashboard/generator")}
          />
          <AndroidAction
            label="Voice study"
            hint="Learn hands-free"
            icon={Mic}
            tone="cyan"
            onClick={() => (firstDueDeck ? startQuickStudy() : navigate("/dashboard/study"))}
          />
          <AndroidAction
            label="Ask Aura"
            hint="Explain a hard concept"
            icon={MessageCircle}
            tone="pink"
            onClick={() => navigate("/dashboard/chat")}
          />
        </div>
      </section>

      <section>
        <div className="android-section-heading">
          <div>
            <h2>Your learning</h2>
            <span>
              {decks.length} decks · {cards.length} cards
            </span>
          </div>
          <button
            type="button"
            onClick={() => navigate("/dashboard/decks")}
            className="android-text-button"
          >
            See all <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
        <div className="android-stat-strip">
          <div>
            <span className="android-stat-value">{studiedToday}</span>
            <span className="android-stat-label">Today</span>
          </div>
          <div>
            <span className="android-stat-value android-stat-violet">{mastered}</span>
            <span className="android-stat-label">Mastered</span>
          </div>
          <div>
            <span className="android-stat-value android-stat-amber">{user?.streak ?? 0}</span>
            <span className="android-stat-label">Streak</span>
          </div>
        </div>
      </section>

      <section>
        <div className="android-section-heading">
          <h2>Continue learning</h2>
          <button
            type="button"
            onClick={() => navigate("/dashboard/decks")}
            className="android-text-button"
          >
            Library <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
        {decks.length > 0 ? (
          <div className="android-deck-list">
            {decks.slice(0, 3).map((deck) => (
              <AndroidDeckRow
                key={deck.id}
                deck={deck}
                cards={cards}
                onStudy={() => startStudyForDeck(deck.id)}
                onEdit={() => navigate(`/deck/${deck.id}`)}
              />
            ))}
          </div>
        ) : (
          <button
            type="button"
            className="android-empty-card"
            onClick={() => navigate("/dashboard/generator")}
          >
            <span className="android-empty-icon">
              <Layers className="h-5 w-5" aria-hidden />
            </span>
            <span>
              <strong>Build your first deck</strong>
              <small>Start with a topic, PDF, video, or recording.</small>
            </span>
            <ChevronRight className="ml-auto h-5 w-5 text-slate-500" aria-hidden />
          </button>
        )}
      </section>
    </div>
  );
}

export function AndroidLibrary() {
  const navigate = useNavigate();
  const workspace = useDashboardWorkspace();
  const { decks, cards, createDeck, deleteDeck } = workspace!;
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newDeckTitle, setNewDeckTitle] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Deck | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const filtered = useMemo(
    () =>
      decks.filter((deck) =>
        `${deck.title} ${deck.description ?? ""}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [decks, query],
  );

  const handleCreate = async () => {
    const title = newDeckTitle.trim();
    if (!title) return;
    setActionBusy(true);
    try {
      const deck = await createDeck(title, "");
      if (!deck) throw new Error("Could not create the deck.");
      setNewDeckTitle("");
      setCreateOpen(false);
      toast.success(`Created ${deck.title}`);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not create the deck.");
    } finally {
      setActionBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionBusy(true);
    try {
      await deleteDeck(deleteTarget.id);
      toast.success(`Deleted ${deleteTarget.title}`);
      setDeleteTarget(null);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not delete the deck.");
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <div className="android-screen">
      <AndroidScreenHeader
        eyebrow="YOUR KNOWLEDGE"
        title="Library"
        detail={`${decks.length} decks · ${cards.length} cards`}
        action={
          <button
            type="button"
            className="android-round-action"
            onClick={() => setCreateOpen(true)}
            aria-label="Create deck"
          >
            <Plus className="h-5 w-5" aria-hidden />
          </button>
        }
      />
      {(createOpen || deleteTarget) && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/70 p-4 backdrop-blur-sm sm:items-center"
          role="presentation"
          onClick={() => {
            if (actionBusy) return;
            setCreateOpen(false);
            setDeleteTarget(null);
          }}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-indigo-200/15 bg-[#11182b] p-5 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby={createOpen ? "android-create-deck-title" : "android-delete-deck-title"}
            onClick={(event) => event.stopPropagation()}
          >
            {createOpen ? (
              <>
                <p className="android-eyebrow">NEW DECK</p>
                <h2
                  id="android-create-deck-title"
                  className="mt-2 text-xl font-extrabold text-white"
                >
                  Give it a home
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Name the collection you want to return to.
                </p>
                <input
                  autoFocus
                  value={newDeckTitle}
                  onChange={(event) => setNewDeckTitle(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void handleCreate();
                    if (event.key === "Escape" && !actionBusy) setCreateOpen(false);
                  }}
                  className="mt-5 min-h-12 w-full rounded-2xl border border-indigo-200/15 bg-slate-950/50 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-300/60"
                  placeholder="e.g. Biology foundations"
                  aria-label="New deck name"
                />
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    type="button"
                    className="android-native-secondary"
                    onClick={() => setCreateOpen(false)}
                    disabled={actionBusy}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="android-native-primary"
                    onClick={() => void handleCreate()}
                    disabled={actionBusy || !newDeckTitle.trim()}
                  >
                    {actionBusy ? "Creating…" : "Create deck"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="android-eyebrow">DELETE DECK</p>
                <h2
                  id="android-delete-deck-title"
                  className="mt-2 text-xl font-extrabold text-white"
                >
                  Delete {deleteTarget?.title}?
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  This removes the deck and its cards. This action cannot be undone.
                </p>
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    type="button"
                    className="android-native-secondary"
                    onClick={() => setDeleteTarget(null)}
                    disabled={actionBusy}
                  >
                    Keep deck
                  </button>
                  <button
                    type="button"
                    className="android-native-danger"
                    onClick={() => void handleDelete()}
                    disabled={actionBusy}
                  >
                    {actionBusy ? "Deleting…" : "Delete deck"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <div className="android-search-box">
        <Search className="h-4 w-4" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search your decks"
          aria-label="Search decks"
        />
      </div>
      {filtered.length > 0 ? (
        <div className="android-deck-list">
          {filtered.map((deck) => (
            <AndroidDeckRow
              key={deck.id}
              deck={deck}
              cards={cards}
              onStudy={() => navigate(`/dashboard/study/${deck.id}`)}
              onEdit={() => navigate(`/deck/${deck.id}`)}
              onDelete={() => setDeleteTarget(deck)}
            />
          ))}
        </div>
      ) : (
        <div className="android-empty-state">
          <div className="android-empty-icon">
            <BookOpen className="h-6 w-6" aria-hidden />
          </div>
          <h2>{query ? "No decks found" : "Your library is empty"}</h2>
          <p>
            {query
              ? "Try another search."
              : "Create a deck or let AuraMind build one from your study material."}
          </p>
          <button
            type="button"
            className="android-primary-button"
            onClick={() => navigate("/dashboard/generator")}
          >
            <Sparkles className="h-4 w-4" aria-hidden /> Generate with AI
          </button>
        </div>
      )}
    </div>
  );
}

export function AndroidGeneratorFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="android-generator-frame">
      <section className="android-create-hero">
        <span className="android-create-icon">
          <Sparkles className="h-6 w-6" aria-hidden />
        </span>
        <div>
          <p className="android-eyebrow">CREATE WITH AURA</p>
          <h1>Turn anything into a study session.</h1>
          <p>
            Start with a topic, document, video, or voice memo. AuraMind does the heavy lifting.
          </p>
        </div>
      </section>
      <div className="android-source-pills" aria-label="Generation sources">
        <span>Topic</span>
        <span>PDF</span>
        <span>Video</span>
        <span>Voice</span>
      </div>
      {children}
    </div>
  );
}

export function AndroidStudy() {
  const navigate = useNavigate();
  const workspace = useDashboardWorkspace();
  const { decks, cards, startQuickStudy } = workspace!;
  const dueCount = cards.filter((card) => (card.nextReview ?? 0) <= Date.now()).length;
  const studiedToday = cards.filter((card) => (card.lastReviewed ?? 0) >= startOfToday()).length;
  const dueDecks = decks.filter((deck) => deckDue(deck, cards) > 0);

  return (
    <div className="android-screen">
      <AndroidScreenHeader
        eyebrow="REVIEW CENTER"
        title="Study"
        detail={dueCount > 0 ? `${dueCount} cards are ready` : "You are all caught up"}
      />
      <section className="android-study-hero">
        <div className="android-study-icon">
          <Brain className="h-7 w-7" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="android-study-kicker">SMART REVIEW</p>
          <h2>{dueCount > 0 ? "Keep your memory sharp" : "Deepen your mastery"}</h2>
          <p>
            {dueCount > 0
              ? "FSRS has picked the cards that matter most right now."
              : "Take an optional pass through any deck to keep recall strong."}
          </p>
        </div>
        <button
          type="button"
          className="android-primary-button android-primary-button-small"
          onClick={() => decks.length > 0 && startQuickStudy()}
          disabled={decks.length === 0}
        >
          <Play className="h-4 w-4 fill-current" aria-hidden /> Go
        </button>
      </section>
      <div className="android-stat-strip android-study-stats">
        <div>
          <span className="android-stat-value">{dueCount}</span>
          <span className="android-stat-label">Due now</span>
        </div>
        <div>
          <span className="android-stat-value android-stat-cyan">{studiedToday}</span>
          <span className="android-stat-label">Today</span>
        </div>
        <div>
          <span className="android-stat-value android-stat-violet">{decks.length}</span>
          <span className="android-stat-label">Decks</span>
        </div>
      </div>
      <section>
        <div className="android-section-heading">
          <h2>{dueDecks.length > 0 ? "Priority queue" : "Choose a deck"}</h2>
          <span>{dueDecks.length > 0 ? "Recommended first" : "Study at your pace"}</span>
        </div>
        <div className="android-deck-list">
          {(dueDecks.length > 0 ? dueDecks : decks).map((deck) => (
            <AndroidDeckRow
              key={deck.id}
              deck={deck}
              cards={cards}
              onStudy={() => navigate(`/dashboard/study/${deck.id}`)}
              onEdit={() => navigate(`/deck/${deck.id}`)}
            />
          ))}
        </div>
        {decks.length === 0 && (
          <div className="android-empty-state">
            <div className="android-empty-icon">
              <Brain className="h-6 w-6" aria-hidden />
            </div>
            <h2>No decks yet</h2>
            <p>Create your first deck to start a study session.</p>
            <button
              type="button"
              className="android-primary-button"
              onClick={() => navigate("/dashboard/generator")}
            >
              <Plus className="h-4 w-4" aria-hidden /> Create a deck
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

export default AndroidOverview;
