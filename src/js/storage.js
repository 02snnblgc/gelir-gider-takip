const KEY = 'hatirlat-data-v1';
const emptyState = () => ({ records: [], reminders: [], monthNotes: {}, preferences: { mode: 'light', accent: 'lavender' } });

export function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!parsed || typeof parsed !== 'object') return emptyState();
    return {
      ...emptyState(), ...parsed,
      records: Array.isArray(parsed.records) ? parsed.records : [],
      reminders: Array.isArray(parsed.reminders) ? parsed.reminders : [],
      monthNotes: parsed.monthNotes && typeof parsed.monthNotes === 'object' ? parsed.monthNotes : {},
      preferences: { ...emptyState().preferences, ...(parsed.preferences || {}) }
    };
  } catch (error) {
    console.error('Kayıtlar okunamadı:', error);
    return emptyState();
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    console.error('Kayıtlar kaydedilemedi:', error);
    return false;
  }
}

export function createId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
