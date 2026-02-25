import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import FileUploadForm from "./FileUploadForm";
import FilesList from "./FilesList";

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, index)).toFixed(1)} ${units[index]}`;
}

export default async function FilesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return (
      <section className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold text-slate-900">Files</h1>
          <p className="mt-1 text-sm text-slate-600">
            Access Levin's Bend documents and downloadable PDFs.
          </p>
        </header>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">
            Please sign in to view files.
          </p>
        </div>
      </section>
    );
  }

  const membership = await prisma.userOrganization.findFirst({
    where: { userId: session.user.id },
    include: { organization: true },
  });

  if (!membership) {
    return (
      <section className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold text-slate-900">Files</h1>
          <p className="mt-1 text-sm text-slate-600">
            Access Levin's Bend documents and downloadable PDFs.
          </p>
        </header>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">
            Your account is not linked to Levin's Bend yet.
          </p>
        </div>
      </section>
    );
  }

  const files = await prisma.file.findMany({
    where: { organizationId: membership.organizationId },
    include: { uploadedBy: true },
    orderBy: { createdAt: "desc" },
  });

  const canUpload =
    membership.role === "ORG_ADMIN" || Boolean(session.user.isSystemAdmin);

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Files</h1>
          <p className="mt-1 text-sm text-slate-600">
            Access Levin's Bend documents and downloadable PDFs.
          </p>
        </div>
      </header>

      {canUpload ? (
        <FileUploadForm organizationId={membership.organizationId} />
      ) : null}

      {files.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">
            No files uploaded yet. Check back soon.
          </p>
        </div>
      ) : (
        <FilesList
          canDelete={canUpload}
          files={files.map((file) => ({
            id: file.id,
            name: file.name,
            fileName: file.fileName,
            fileUrl: file.fileUrl,
            fileSize: formatBytes(file.fileSize),
            uploadedByName: `${file.uploadedBy.firstName} ${file.uploadedBy.lastName}`,
          }))}
        />
      )}
    </section>
  );
}
