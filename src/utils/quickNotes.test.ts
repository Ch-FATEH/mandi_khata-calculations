import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clearCompletedQuickNotes,
  createQuickNote,
  deleteQuickNote,
  filterQuickNotes,
  sortQuickNotes,
  toggleQuickNoteDone,
  toggleQuickNotePin,
  updateQuickNote,
} from './quickNotes';

test('createQuickNote trims text and rejects empty or whitespace-only input', () => {
  assert.equal(createQuickNote('   ', 'reminder'), null);
  const note = createQuickNote('  Wheat rate today 4350/maund  ', 'rate', '2026-11-24T09:00:00.000Z');
  assert.ok(note);
  assert.equal(note.text, 'Wheat rate today 4350/maund');
  assert.equal(note.tag, 'rate');
  assert.equal(note.done, false);
  assert.equal(note.pinned, false);
});

test('sortQuickNotes orders pinned first, then incomplete, then newest createdAt', () => {
  const n1 = createQuickNote('Older reminder', 'reminder', '2026-11-24T08:00:00.000Z')!;
  const n2 = createQuickNote('Newer task', 'task', '2026-11-24T10:00:00.000Z')!;
  const n3 = createQuickNote('Pinned rate', 'rate', '2026-11-24T07:00:00.000Z')!;
  const n4 = createQuickNote('Done item', 'task', '2026-11-24T11:00:00.000Z')!;

  let list = [n1, n2, n3, n4];
  list = toggleQuickNotePin(list, n3.id);
  list = toggleQuickNoteDone(list, n4.id);

  const ordered = sortQuickNotes(list);
  assert.deepEqual(
    ordered.map((n) => n.text),
    ['Pinned rate', 'Newer task', 'Older reminder', 'Done item']
  );
});

test('filterQuickNotes, updateQuickNote, deleteQuickNote, and clearCompletedQuickNotes behave accurately', () => {
  const r = createQuickNote('1509 rate 4600', 'rate', '2026-11-24T08:00:00.000Z')!;
  const t = createQuickNote('Call Haji Akram', 'task', '2026-11-24T09:00:00.000Z')!;
  let list = [r, t];

  list = updateQuickNote(list, r.id, '1509 rate 4650', 'rate');
  assert.equal(list.find((x) => x.id === r.id)?.text, '1509 rate 4650');

  // Empty edit text is ignored safely
  list = updateQuickNote(list, r.id, '   ');
  assert.equal(list.find((x) => x.id === r.id)?.text, '1509 rate 4650');

  assert.equal(filterQuickNotes(list, 'rate').length, 1);

  list = toggleQuickNoteDone(list, t.id);
  assert.equal(filterQuickNotes(list, 'active').length, 1);

  list = clearCompletedQuickNotes(list);
  assert.equal(list.length, 1);
  assert.equal(list[0].id, r.id);

  list = deleteQuickNote(list, r.id);
  assert.equal(list.length, 0);
});
