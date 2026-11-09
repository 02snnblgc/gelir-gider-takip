export function downloadFile(name, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportJson(state) {
  downloadFile(`hatirlat-yedek-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ app: 'Hatırlat', version: 1, exportedAt: new Date().toISOString(), data: state }, null, 2), 'application/json;charset=utf-8');
}

export function exportCsv(records, period) {
  const rows = [['Tür', 'Kategori', 'Miktar (TL)', 'Tarih', 'Tekrar', 'Not'], ...records.filter((item) => item.date?.startsWith(period)).map((item) => [item.type === 'income' ? 'Gelir' : 'Gider', item.category, item.amount, item.date, item.repeat || 'none', item.note || ''])];
  const csv = '\ufeff' + rows.map((row) => row.map((field) => `"${String(field ?? '').replaceAll('"', '""')}"`).join(';')).join('\r\n');
  downloadFile(`hatirlat-${period}.csv`, csv, 'text/csv;charset=utf-8');
}

export async function importJson(file) {
  const parsed = JSON.parse(await file.text());
  const data = parsed?.data || parsed;
  if (!data || !Array.isArray(data.records) || !Array.isArray(data.reminders)) throw new Error('Dosya Hatırlat yedeği biçiminde değil.');
  return { records: data.records, reminders: data.reminders, monthNotes: data.monthNotes || {}, preferences: data.preferences || {} };
}
