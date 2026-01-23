export default function CalendarPage() {
  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Calendar</h1>
        <p className="mt-1 text-sm text-slate-600">
          Track community events and meeting schedules.
        </p>
      </header>

      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
        Calendar view will render here once events are connected.
      </div>
    </section>
  );
}
