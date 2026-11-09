export const INCOME_CATEGORIES = ['Maaş', 'Ek Gelir', 'Kira Geliri', 'Türkiye Finanstan Çekilen'];
export const EXPENSE_CATEGORIES = ['Ziraat Bankası Troy', 'Ziraat Bankası M.Card', 'Halk Bankası Troy', 'Halk Bankası M.Card', 'Türkiye Finans', 'Elektrik Faturası', 'Su Faturası', 'Doğal gaz Faturası', 'Sıcak Su Doğal gaz Faturası', 'İnternet Faturası', 'Site Aidatı', 'Sabiha Telefon Faturası', 'Sinan Telefon Faturası', 'Hüda Nur Telefon Faturası', 'Hüda Nur Aylık', 'Sabihaya', 'Sinana', 'Traş İçin', 'İş Yeri Yemek', 'İş Yeri Çay', 'İş Yeri Su', 'Araç Sigortası', 'Araç Muayenesi', 'Araç Bakımı', 'Araç Lastiği', 'Kira / Konut', 'Mutfak & Market', 'Eğitim & Kurs', 'Sağlık & Bakım', 'Diğer'];

export const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
export const monthLabel = (date) => new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' }).format(date);
export const money = (amount) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(Number(amount) || 0);
export const dateLabel = (value, options = { day: 'numeric', month: 'short', year: 'numeric' }) => {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('tr-TR', options).format(date);
};

export function periodTotals(records, period) {
  const items = records.filter((item) => item.date?.startsWith(period));
  const income = items.filter((item) => item.type === 'income').reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const expense = items.filter((item) => item.type === 'expense').reduce((sum, item) => sum + Number(item.amount || 0), 0);
  return { income, expense, balance: income - expense, count: items.length };
}
