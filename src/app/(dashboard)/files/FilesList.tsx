"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type FileItem = {
  id: string;
  name: string;
  fileName: string;
  fileUrl: string;
  fileSize: string;
  uploadedByName: string;
};

type FilesListProps = {
  canDelete: boolean;
  files: FileItem[];
};

export default function FilesList({
  canDelete,
  files,
}: FilesListProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(fileId: string) {
    if (!confirm("Delete this file? This cannot be undone.")) {
      return;
    }

    setIsDeleting(fileId);
    setError(null);

    const response = await fetch(`/api/files/${fileId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error || "Unable to delete file.");
      setIsDeleting(null);
      return;
    }

    setIsDeleting(null);
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      {error ? (
        <div className="border-b border-rose-200 bg-rose-50 px-6 py-3 text-xs text-rose-700">
          {error}
        </div>
      ) : null}
      <div className="divide-y divide-slate-200">
        {files.map((file) => (
          <div
            key={file.id}
            className="flex flex-wrap items-center justify-between gap-4 px-6 py-4"
          >
            <div>
              <p className="text-sm font-medium text-slate-900">{file.name}</p>
              <p className="text-xs text-slate-500">
                {file.fileName} · {file.fileSize} · Uploaded by{" "}
                {file.uploadedByName}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <a
                href={file.fileUrl}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                target="_blank"
                rel="noreferrer"
              >
                Download
              </a>
              {canDelete ? (
                <button
                  type="button"
                  onClick={() => handleDelete(file.id)}
                  disabled={isDeleting === file.id}
                  className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:border-rose-300 hover:text-rose-800 disabled:cursor-not-allowed disabled:border-rose-100 disabled:text-rose-300"
                >
                  {isDeleting === file.id ? "Deleting..." : "Delete"}
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
