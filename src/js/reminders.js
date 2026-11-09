const fired = new Set();

function dueReminderPoints(reminder, now) {
  const eventTime = new Date(reminder.datetime).getTime();
  if (!Number.isFinite(eventTime)) return [];
  const offsets = Array.isArray(reminder.offsets) ? reminder.offsets : [0];
  return offsets.map((minutes) => ({ at: eventTime - Number(minutes) * 60_000, suffix: Number(minutes) === 0 ? 'şimdi' : `${minutes} dakika önce` }))
    .filter((point) => point.at <= now && point.at > now - 60_000);
}

export function checkReminders(reminders, onAlert) {
  const now = Date.now();
  for (const reminder of reminders) {
    if (reminder.completed) continue;
    for (const point of dueReminderPoints(reminder, now)) {
      const key = `${reminder.id}:${point.at}`;
      if (fired.has(key)) continue;
      fired.add(key);
      onAlert(reminder, point.suffix);
    }
    if (reminder.snoozedUntil && Number(reminder.snoozedUntil) <= now && Number(reminder.snoozedUntil) > now - 60_000) {
      const key = `${reminder.id}:snooze:${reminder.snoozedUntil}`;
      if (!fired.has(key)) { fired.add(key); onAlert(reminder, 'ertelenen hatırlatma'); }
    }
  }
}

export function sendNotification(reminder, timing) {
  const body = [reminder.note, `Zamanı: ${timing}`].filter(Boolean).join(' · ');
  if ('Notification' in window && Notification.permission === 'granted') {
    try { new Notification(reminder.title, { body, icon: './assets/app-icon.svg', tag: reminder.id }); } catch (error) { console.warn('Bildirim gösterilemedi:', error); }
  }
}

// This timer only runs while this page is active. It is not a substitute for Android AlarmManager.
