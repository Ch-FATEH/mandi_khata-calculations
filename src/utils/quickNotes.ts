import { QuickNote, QuickNoteTag } from '../types/mandi';

export type QuickNoteFilter = 'all' | 'active' | 'rate';

export function createQuickNote(
  rawText: string,
  tag: QuickNoteTag,
  nowIso: string = new Date().toISOString()
): QuickNote | null {
  const text = rawText.trim();
  if (!text) return null;
  return {
    id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    text,
    tag,
    done: false,
    pinned: false,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

export function sortQuickNotes(notes: QuickNote[]): QuickNote[] {
  return [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (a.done !== b.done) return a.done ? 1 : -1;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export function filterQuickNotes(
  notes: QuickNote[],
  filter: QuickNoteFilter
): QuickNote[] {
  const sorted = sortQuickNotes(notes);
  if (filter === 'active') return sorted.filter((n) => !n.done);
  if (filter === 'rate') return sorted.filter((n) => n.tag === 'rate');
  return sorted;
}

export function toggleQuickNoteDone(
  notes: QuickNote[],
  id: string,
  nowIso: string = new Date().toISOString()
): QuickNote[] {
  return notes.map((n) =>
    n.id === id ? { ...n, done: !n.done, updatedAt: nowIso } : n
  );
}

export function toggleQuickNotePin(
  notes: QuickNote[],
  id: string,
  nowIso: string = new Date().toISOString()
): QuickNote[] {
  return notes.map((n) =>
    n.id === id ? { ...n, pinned: !n.pinned, updatedAt: nowIso } : n
  );
}

export function updateQuickNote(
  notes: QuickNote[],
  id: string,
  rawText: string,
  tag?: QuickNoteTag,
  nowIso: string = new Date().toISOString()
): QuickNote[] {
  const text = rawText.trim();
  if (!text) return notes;
  return notes.map((n) =>
    n.id === id
      ? {
          ...n,
          text,
          tag: tag ?? n.tag,
          updatedAt: nowIso,
        }
      : n
  );
}

export function deleteQuickNote(notes: QuickNote[], id: string): QuickNote[] {
  return notes.filter((n) => n.id !== id);
}

export function clearCompletedQuickNotes(notes: QuickNote[]): QuickNote[] {
  return notes.filter((n) => !n.done);
}
