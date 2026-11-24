import React, { useMemo, useState } from 'react';
import {
  Check,
  Edit3,
  Pin,
  Plus,
  StickyNote,
  Trash2,
  X,
} from 'lucide-react';
import { AppLanguage, QuickNote, QuickNoteTag } from '../types/mandi';
import { Translations } from '../i18n/translations';
import { filterQuickNotes, QuickNoteFilter } from '../utils/quickNotes';

interface QuickNotesCardProps {
  language: AppLanguage;
  t: Translations;
  notes: QuickNote[];
  onAddNote: (text: string, tag: QuickNoteTag) => void;
  onToggleDone: (id: string) => void;
  onTogglePin: (id: string) => void;
  onEditNote: (id: string, text: string, tag: QuickNoteTag) => void;
  onDeleteNote: (id: string) => void;
  onClearDone: () => void;
}

export const QuickNotesCard: React.FC<QuickNotesCardProps> = ({
  language,
  t,
  notes,
  onAddNote,
  onToggleDone,
  onTogglePin,
  onEditNote,
  onDeleteNote,
  onClearDone,
}) => {
  const [draftText, setDraftText] = useState('');
  const [draftTag, setDraftTag] = useState<QuickNoteTag>('reminder');
  const [filter, setFilter] = useState<QuickNoteFilter>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingTag, setEditingTag] = useState<QuickNoteTag>('reminder');

  const visibleNotes = useMemo(
    () => filterQuickNotes(notes, filter),
    [notes, filter]
  );

  const pendingCount = useMemo(
    () => notes.filter((n) => !n.done).length,
    [notes]
  );

  const doneCount = notes.length - pendingCount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftText.trim()) return;
    onAddNote(draftText, draftTag);
    setDraftText('');
  };

  const startEdit = (note: QuickNote) => {
    setEditingId(note.id);
    setEditingText(note.text);
    setEditingTag(note.tag);
  };

  const saveEdit = (id: string) => {
    if (!editingText.trim()) return;
    onEditNote(id, editingText, editingTag);
    setEditingId(null);
    setEditingText('');
  };

  const getTagBadge = (tag: QuickNoteTag) => {
    if (tag === 'rate') {
      return {
        label: t.quickNotesTagRate,
        cls: 'bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-[#F2CC70]',
      };
    }
    if (tag === 'task') {
      return {
        label: t.quickNotesTagTask,
        cls: 'bg-emerald-100 text-[#12452D] dark:bg-emerald-950/70 dark:text-emerald-300',
      };
    }
    return {
      label: t.quickNotesTagReminder,
      cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    };
  };

  const formatNoteTime = (iso: string) => {
    const dt = new Date(iso);
    if (Number.isNaN(dt.getTime())) return '';
    try {
      return new Intl.DateTimeFormat(language === 'ur' ? 'ur-PK' : 'en-PK', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(dt);
    } catch {
      return iso.slice(0, 10);
    }
  };

  return (
    <section
      aria-labelledby="quick-notes-heading"
      className="rounded-3xl border border-[#D9AA45]/45 bg-[#FFFDF7] p-5 shadow-sm dark:border-[#D9AA45]/30 dark:bg-slate-900"
    >
      {/* Header Row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-[#9c7218] dark:bg-amber-950/70 dark:text-[#F2CC70]">
            <StickyNote className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="quick-notes-heading"
                className="text-base font-extrabold text-slate-900 dark:text-slate-100"
              >
                {t.quickNotesTitle}
              </h2>
              {pendingCount > 0 && (
                <span className="ltr-num rounded-lg bg-[#0B7D50] px-2 py-0.5 text-[11px] font-bold text-white">
                  {pendingCount}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
              {t.quickNotesSubtitle}
            </p>
          </div>
        </div>

        {/* Filter Segments + Clear Done */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl bg-slate-200/70 p-1 dark:bg-slate-800">
            {(
              [
                { id: 'all', label: t.quickNotesFilterAll },
                { id: 'active', label: t.quickNotesFilterActive },
                { id: 'rate', label: t.quickNotesFilterRates },
              ] as { id: QuickNoteFilter; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`min-h-[32px] rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  filter === tab.id
                    ? 'bg-[#0B7D50] text-white shadow-sm'
                    : 'text-slate-700 hover:text-slate-900 dark:text-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {doneCount > 0 && (
            <button
              type="button"
              onClick={onClearDone}
              className="min-h-[34px] rounded-xl border border-slate-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              {t.quickNotesClearDone}
            </button>
          )}
        </div>
      </div>

      {/* Add Quick Note Form */}
      <form onSubmit={handleSubmit} className="mt-4 space-y-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'reminder', label: t.quickNotesTagReminder },
              { id: 'task', label: t.quickNotesTagTask },
              { id: 'rate', label: t.quickNotesTagRate },
            ] as { id: QuickNoteTag; label: string }[]
          ).map((tg) => (
            <button
              key={tg.id}
              type="button"
              onClick={() => setDraftTag(tg.id)}
              aria-pressed={draftTag === tg.id}
              className={`min-h-[34px] rounded-xl border px-3 py-1 text-xs font-bold transition ${
                draftTag === tg.id
                  ? 'border-[#0B7D50] bg-[#0B7D50] text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-[#0B7D50] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
              }`}
            >
              {tg.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="quick-note-input"
            type="text"
            aria-label={t.quickNotesTitle}
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            placeholder={t.quickNotesPlaceholder}
            className="min-h-[44px] flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-[#0B7D50] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <button
            type="submit"
            disabled={!draftText.trim()}
            className="flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#0B7D50] px-4 py-2 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#12452D] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            <span>{t.quickNotesAddBtn}</span>
          </button>
        </div>
      </form>

      {/* Notes List */}
      <div className="mt-4">
        {visibleNotes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-amber-800/20 bg-white/70 p-4 text-center text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
            {t.quickNotesEmpty}
          </div>
        ) : (
          <ul className="divide-y divide-dashed divide-amber-800/20 rounded-2xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-950/40">
            {visibleNotes.map((note) => {
              const badge = getTagBadge(note.tag);
              const isEditing = editingId === note.id;
              return (
                <li
                  key={note.id}
                  className={`flex items-start justify-between gap-3 px-3.5 py-3 transition ${
                    note.pinned ? 'bg-amber-50/50 dark:bg-amber-950/15' : ''
                  }`}
                >
                  {isEditing ? (
                    <div className="flex flex-1 flex-wrap items-center gap-2">
                      <input
                        type="text"
                        aria-label={`${t.edit}: ${note.text}`}
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            saveEdit(note.id);
                          } else if (e.key === 'Escape') {
                            setEditingId(null);
                          }
                        }}
                        className="min-h-[38px] min-w-[180px] flex-1 rounded-xl border border-[#0B7D50] bg-white px-3 py-1.5 text-sm text-slate-900 focus:outline-none dark:bg-slate-800 dark:text-slate-100"
                      />
                      <select
                        aria-label={t.categoryLabel}
                        value={editingTag}
                        onChange={(e) => setEditingTag(e.target.value as QuickNoteTag)}
                        className="min-h-[38px] rounded-xl border border-slate-300 bg-white px-2.5 py-1 text-xs font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      >
                        <option value="reminder">{t.quickNotesTagReminder}</option>
                        <option value="task">{t.quickNotesTagTask}</option>
                        <option value="rate">{t.quickNotesTagRate}</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => saveEdit(note.id)}
                        aria-label={`${t.save}: ${note.text}`}
                        className="flex min-h-[38px] items-center gap-1 rounded-xl bg-[#0B7D50] px-3 py-1 text-xs font-bold text-white"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>{t.save}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        aria-label={t.cancel}
                        className="flex min-h-[38px] items-center rounded-xl border border-slate-300 px-2.5 py-1 text-xs font-bold text-slate-700 dark:border-slate-700 dark:text-slate-300"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex min-w-0 flex-1 items-start gap-2.5">
                        <button
                          type="button"
                          onClick={() => onToggleDone(note.id)}
                          aria-label={`${note.done ? t.quickNotesUndoLabel : t.quickNotesDoneLabel}: ${note.text}`}
                          aria-pressed={note.done}
                          className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition ${
                            note.done
                              ? 'border-[#0B7D50] bg-[#0B7D50] text-white'
                              : 'border-slate-400 bg-white hover:border-[#0B7D50] dark:border-slate-600 dark:bg-slate-800'
                          }`}
                        >
                          {note.done && <Check className="h-3.5 w-3.5" />}
                        </button>
                        <div className="min-w-0 flex-1">
                          <p
                            className={`break-words text-sm font-semibold ${
                              note.done
                                ? 'text-slate-400 line-through dark:text-slate-500'
                                : 'text-slate-900 dark:text-slate-100'
                            }`}
                          >
                            {note.text}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                            <span className={`rounded-md px-2 py-0.5 font-bold ${badge.cls}`}>
                              {badge.label}
                            </span>
                            {note.pinned && (
                              <span className="font-bold text-amber-700 dark:text-[#F2CC70]">
                                • {language === 'ur' ? 'پن شدہ' : 'Pinned'}
                              </span>
                            )}
                            <span className="ltr-num text-slate-500 dark:text-slate-400">
                              {formatNoteTime(note.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onTogglePin(note.id)}
                          aria-label={`${note.pinned ? t.quickNotesUnpinLabel : t.quickNotesPinLabel}: ${note.text}`}
                          aria-pressed={note.pinned}
                          className={`rounded-lg p-1.5 transition ${
                            note.pinned
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-[#F2CC70]'
                              : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                          }`}
                        >
                          <Pin className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => startEdit(note)}
                          aria-label={`${t.edit}: ${note.text}`}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteNote(note.id)}
                          aria-label={`${t.delete}: ${note.text}`}
                          className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/60"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
};
