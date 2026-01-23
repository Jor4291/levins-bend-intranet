export default function FeedPage() {
  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Announcements</h1>
        <p className="mt-1 text-sm text-slate-600">
          Latest updates from your association board.
        </p>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">
          No announcements yet. Create your first update in the admin view.
        </p>
      </div>
    </section>
  );
}
