export default function ProfilePage() {
  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Profile</h1>
        <p className="mt-1 text-sm text-slate-600">
          Manage your contact details and account settings.
        </p>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">
          Profile settings will appear here once authentication is wired up.
        </p>
      </div>
    </section>
  );
}
