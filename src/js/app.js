import { loadState, saveState, createId } from './storage.js';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, monthKey, monthLabel, money, dateLabel, periodTotals } from './finance.js';
import { exportCsv, exportJson, importJson } from './export.js';
import { checkReminders, sendNotification } from './reminders.js';

let state = loadState();
let period = monthKey(new Date());
const $ = (id) => document.getElementById(id);
const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
let toastTimer;

function toast(message) {
  const element = $('toast'); element.textContent = message; element.classList.add('visible');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => element.classList.remove('visible'), 2600);
}
function persist() { if (!saveState(state)) toast('Depolama alanı dolu olabilir. JSON yedeği alın.'); }
function setTheme() {
  document.documentElement.dataset.mode = state.preferences.mode;
  document.documentElement.dataset.accent = state.preferences.accent;
  $('theme-mode').value = state.preferences.mode; $('accent-color').value = state.preferences.accent;
}
function renderCategories() {
  $('category-options').innerHTML = [...new Set([...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES])].map((name) => `<option value="${escapeHtml(name)}"></option>`).join('');
}
function render() {
  const date = new Date(`${period}-01T00:00:00`);
  $('period-label').textContent = monthLabel(date);
  const totals = periodTotals(state.records, period);
  $('income-total').textContent = money(totals.income); $('expense-total').textContent = money(totals.expense); $('balance-total').textContent = money(totals.balance);
  $('month-note').value = state.monthNotes[period] || '';
  const records = state.records.filter((item) => item.date?.startsWith(period)).sort((a, b) => b.date.localeCompare(a.date));
  $('record-count').textContent = records.length;
  $('finance-list').innerHTML = records.length ? records.map((item) => `<article class="record ${item.type}"><div class="record-main"><div class="record-title"><strong>${escapeHtml(item.category)}</strong><span class="pill ${item.type}">${item.type === 'income' ? 'Gelir' : 'Gider'}</span></div><div class="record-meta">${dateLabel(item.date)}${item.repeat && item.repeat !== 'none' ? ` · ${item.repeat === 'monthly' ? 'Aylık tekrar' : 'Yıllık tekrar'}` : ''}${item.note ? ` · ${escapeHtml(item.note)}` : ''}</div></div><strong class="record-amount ${item.type}">${item.type === 'income' ? '+' : '−'}${money(item.amount)}</strong><div class="record-actions"><button data-edit-record="${item.id}" class="text-button">Düzenle</button><button data-delete-record="${item.id}" class="text-button danger">Sil</button></div></article>`).join('') : '<p class="empty">Bu ay henüz kayıt yok.</p>';
  renderReminders();
}
function renderReminders() {
  const query = $('search-input').value.trim().toLocaleLowerCase('tr-TR');
  const dateFilter = $('filter-date').value; const status = $('filter-status').value;
  const results = [...state.reminders].filter((item) => {
    const matchesText = !query || `${item.title} ${item.category || ''}`.toLocaleLowerCase('tr-TR').includes(query);
    const matchesDate = !dateFilter || item.datetime.startsWith(dateFilter);
    const matchesStatus = status === 'all' || (status === 'done' ? item.completed : !item.completed);
    return matchesText && matchesDate && matchesStatus;
  }).sort((a, b) => a.datetime.localeCompare(b.datetime));
  $('reminder-list').innerHTML = results.length ? results.map((item) => `<article class="record reminder ${item.completed ? 'is-complete' : ''}"><div class="record-main"><div class="record-title"><strong>${escapeHtml(item.title)}</strong>${item.completed ? '<span class="pill done">Tamamlandı</span>' : '<span class="pill pending">Bekliyor</span>'}</div><div class="record-meta">${escapeHtml(item.category || 'Genel')} · ${new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(item.datetime))}${item.repeat !== 'none' ? ` · ${escapeHtml(item.repeat)}` : ''}${item.note ? ` · ${escapeHtml(item.note)}` : ''}</div></div><div class="record-actions"><button data-toggle-reminder="${item.id}" class="text-button">${item.completed ? 'Geri aç' : 'Tamamlandı'}</button><button data-snooze-reminder="${item.id}" class="text-button" ${item.completed ? 'disabled' : ''}>Ertele</button><button data-edit-reminder="${item.id}" class="text-button">Düzenle</button><button data-delete-reminder="${item.id}" class="text-button danger">Sil</button></div></article>`).join('') : '<p class="empty">Aramanızla eşleşen hatırlatma yok.</p>';
}
function clearFinanceForm() { $('finance-form').reset(); $('finance-id').value = ''; $('finance-date').value = `${period}-${String(new Date().getDate()).padStart(2, '0')}`; $('cancel-finance-edit').classList.add('hidden'); $('finance-form').querySelector('[type=submit]').textContent = 'Kaydı ekle'; }
function clearReminderForm() { $('reminder-form').reset(); $('reminder-id').value = ''; $('cancel-reminder-edit').classList.add('hidden'); $('reminder-form').querySelector('[type=submit]').textContent = 'Hatırlatıcı ekle'; }

$('previous-month').addEventListener('click', () => { const d = new Date(`${period}-01T00:00:00`); d.setMonth(d.getMonth() - 1); period = monthKey(d); render(); });
$('next-month').addEventListener('click', () => { const d = new Date(`${period}-01T00:00:00`); d.setMonth(d.getMonth() + 1); period = monthKey(d); render(); });
$('save-month-note').addEventListener('click', () => { state.monthNotes[period] = $('month-note').value; persist(); toast('Dönem notu kaydedildi.'); });
$('theme-mode').addEventListener('change', (event) => { state.preferences.mode = event.target.value; persist(); setTheme(); });
$('accent-color').addEventListener('change', (event) => { state.preferences.accent = event.target.value; persist(); setTheme(); });

$('finance-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const id = $('finance-id').value; const type = $('finance-type').value; const category = $('finance-category').value.trim();
  const duplicate = state.records.some((item) => item.id !== id && item.type === type && item.category.toLocaleLowerCase('tr-TR') === category.toLocaleLowerCase('tr-TR') && item.date === $('finance-date').value);
  if (duplicate && !confirm('Aynı tür, kategori ve tarihte bir kayıt var. Yine de eklensin mi?')) return;
  const item = { id: id || createId(), type, category, amount: Number($('finance-amount').value), date: $('finance-date').value, repeat: $('finance-repeat').value, note: $('finance-note').value.trim() };
  if (id) state.records = state.records.map((record) => record.id === id ? item : record); else state.records.push(item);
  persist(); clearFinanceForm(); render(); toast(id ? 'Kayıt güncellendi.' : 'Kayıt eklendi.');
});
$('cancel-finance-edit').addEventListener('click', clearFinanceForm);
$('finance-list').addEventListener('click', (event) => {
  const edit = event.target.closest('[data-edit-record]'); const remove = event.target.closest('[data-delete-record]');
  if (edit) { const item = state.records.find((record) => record.id === edit.dataset.editRecord); if (!item) return; $('finance-id').value = item.id; $('finance-type').value = item.type; $('finance-category').value = item.category; $('finance-amount').value = item.amount; $('finance-date').value = item.date; $('finance-repeat').value = item.repeat || 'none'; $('finance-note').value = item.note || ''; $('cancel-finance-edit').classList.remove('hidden'); $('finance-form').querySelector('[type=submit]').textContent = 'Kaydı güncelle'; $('finance-form').scrollIntoView({ behavior: 'smooth' }); }
  if (remove && confirm('Bu kaydı silmek istediğinizden emin misiniz?')) { state.records = state.records.filter((record) => record.id !== remove.dataset.deleteRecord); persist(); render(); toast('Kayıt silindi.'); }
});

$('reminder-form').addEventListener('submit', (event) => {
  event.preventDefault(); const id = $('reminder-id').value;
  const offsets = [...document.querySelectorAll('input[name="offset"]:checked')].map((input) => Number(input.value));
  const item = { id: id || createId(), title: $('reminder-title').value.trim(), category: $('reminder-category').value.trim(), datetime: $('reminder-datetime').value, repeat: $('reminder-repeat').value, snoozeMinutes: Number($('reminder-snooze').value), offsets, note: $('reminder-note').value.trim(), completed: state.reminders.find((reminder) => reminder.id === id)?.completed || false };
  if (id) state.reminders = state.reminders.map((reminder) => reminder.id === id ? item : reminder); else state.reminders.push(item);
  persist(); clearReminderForm(); render(); toast(id ? 'Hatırlatıcı güncellendi.' : 'Hatırlatıcı eklendi.');
});
$('cancel-reminder-edit').addEventListener('click', clearReminderForm);
$('reminder-list').addEventListener('click', (event) => {
  const toggle = event.target.closest('[data-toggle-reminder]'); const snooze = event.target.closest('[data-snooze-reminder]'); const edit = event.target.closest('[data-edit-reminder]'); const remove = event.target.closest('[data-delete-reminder]');
  if (toggle) { state.reminders = state.reminders.map((item) => item.id === toggle.dataset.toggleReminder ? { ...item, completed: !item.completed } : item); persist(); render(); }
  if (snooze) { const item = state.reminders.find((entry) => entry.id === snooze.dataset.snoozeReminder); if (item) { item.snoozedUntil = Date.now() + item.snoozeMinutes * 60_000; persist(); toast(`${item.snoozeMinutes} dakika ertelendi.`); } }
  if (edit) { const item = state.reminders.find((entry) => entry.id === edit.dataset.editReminder); if (!item) return; $('reminder-id').value = item.id; $('reminder-title').value = item.title; $('reminder-category').value = item.category || ''; $('reminder-datetime').value = item.datetime; $('reminder-repeat').value = item.repeat; $('reminder-snooze').value = item.snoozeMinutes; $('reminder-note').value = item.note || ''; document.querySelectorAll('input[name="offset"]').forEach((input) => { input.checked = item.offsets.includes(Number(input.value)); }); $('cancel-reminder-edit').classList.remove('hidden'); $('reminder-form').querySelector('[type=submit]').textContent = 'Hatırlatıcıyı güncelle'; $('reminder-form').scrollIntoView({ behavior: 'smooth' }); }
  if (remove && confirm('Bu hatırlatıcı silinsin mi?')) { state.reminders = state.reminders.filter((item) => item.id !== remove.dataset.deleteReminder); persist(); render(); }
});
$('search-input').addEventListener('input', renderReminders); $('filter-date').addEventListener('change', renderReminders); $('filter-status').addEventListener('change', renderReminders);
$('enable-notifications').addEventListener('click', async () => { if (!('Notification' in window)) return toast('Bu tarayıcı bildirimleri desteklemiyor.'); const permission = await Notification.requestPermission(); toast(permission === 'granted' ? 'Bildirim izni verildi.' : 'Bildirim izni verilmedi.'); });
$('backup-export').addEventListener('click', () => exportJson(state));
$('backup-import').addEventListener('change', async (event) => { const file = event.target.files?.[0]; if (!file) return; try { if (!confirm('Geri yükleme mevcut cihaz verilerinin üzerine yazacak. Devam edilsin mi?')) return; state = await importJson(file); persist(); setTheme(); render(); toast('Yedek geri yüklendi.'); } catch (error) { toast(error.message || 'Yedek okunamadı.'); } finally { event.target.value = ''; } });
$('csv-export').addEventListener('click', () => exportCsv(state.records, period));

renderCategories(); setTheme(); clearFinanceForm(); render();
const poll = () => checkReminders(state.reminders, (reminder, timing) => { sendNotification(reminder, timing); toast(`${reminder.title} — ${timing}`); if (confirm(`${reminder.title}\n${reminder.note || ''}\n\nTamamlandı olarak işaretlensin mi?`)) { reminder.completed = true; persist(); render(); } });
setInterval(poll, 15_000); poll();
if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('./service-worker.js').catch((error) => console.warn('Çevrimdışı önbellek başlatılamadı:', error));
