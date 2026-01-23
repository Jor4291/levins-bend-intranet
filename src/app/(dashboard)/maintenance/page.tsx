export default function MaintenancePage() {
  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">
          Maintenance Requests
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Submit and track maintenance issues for your unit.
        </p>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">
          No requests yet. We'll add the submission form next.
        </p>
      </div>
    </section>
  );
}
