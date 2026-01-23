export default function FilesPage() {
  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Files</h1>
        <p className="mt-1 text-sm text-slate-600">
          Access association documents and downloadable PDFs.
        </p>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">
          Uploads will appear here once the file library is connected.
        </p>
      </div>
    </section>
  );
}
