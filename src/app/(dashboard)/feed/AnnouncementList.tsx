"use client";

import { Mail, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Announcement = {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
  author: {
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string | null;
  };
};

type AnnouncementListProps = {
  canManage: boolean;
  announcements: Announcement[];
};

export default function AnnouncementList({
  canManage,
  announcements,
}: AnnouncementListProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(
    event: React.FormEvent<HTMLFormElement>,
    announcementId: string
  ) {
    event.preventDefault();
    const form = event.currentTarget;
    setIsSaving(true);
    setError(null);

    const formData = new FormData(form);
    const payload = {
      title: String(formData.get("title") || "").trim(),
      content: String(formData.get("content") || "").trim(),
      isPinned: formData.get("isPinned") === "on",
    };

    const response = await fetch(`/api/announcements/${announcementId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error || "Unable to update announcement.");
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    setEditingId(null);
    router.refresh();
  }

  async function handleDelete(announcementId: string) {
    if (!confirm("Delete this announcement? This cannot be undone.")) {
      return;
    }

    setIsSaving(true);
    setError(null);

    const response = await fetch(`/api/announcements/${announcementId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error || "Unable to delete announcement.");
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-xs text-rose-700">
          {error}
        </div>
      ) : null}

      {announcements.map((announcement) => {
        const authorName = `${announcement.author.firstName} ${announcement.author.lastName}`;
        const mailto = `mailto:${announcement.author.email}?subject=${encodeURIComponent(
          `Re: ${announcement.title}`
        )}&body=${encodeURIComponent(
          `Regarding your announcement "${announcement.title}":\n\n`
        )}`;
        const isEditing = editingId === announcement.id;

        return (
          <article
            key={announcement.id}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            {isEditing ? (
              <form onSubmit={(event) => handleSave(event, announcement.id)}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium text-slate-700"
                      htmlFor={`title-${announcement.id}`}
                    >
                      Title
                    </label>
                    <input
                      id={`title-${announcement.id}`}
                      name="title"
                      type="text"
                      required
                      defaultValue={announcement.title}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium text-slate-700"
                      htmlFor={`content-${announcement.id}`}
                    >
                      Message
                    </label>
                    <textarea
                      id={`content-${announcement.id}`}
                      name="content"
                      rows={5}
                      required
                      defaultValue={announcement.content}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      name="isPinned"
                      defaultChecked={announcement.isPinned}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    Pin this announcement
                  </label>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="rounded-lg bg-sky-700 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    onClick={() => {
                      setEditingId(null);
                      setError(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                      {announcement.author.avatarUrl ? (
                        <img
                          src={announcement.author.avatarUrl}
                          alt={`${authorName} avatar`}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] font-medium text-slate-400">
                          {announcement.author.firstName
                            .charAt(0)
                            .toUpperCase()}
                          {announcement.author.lastName
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        {announcement.title}
                      </h2>
                      <p className="mt-1 text-xs text-slate-500">
                        {authorName} · {announcement.createdAt}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {announcement.isPinned ? (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        Pinned
                      </span>
                    ) : null}
                    {canManage ? (
                      <>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:border-slate-300"
                          onClick={() => {
                            setEditingId(announcement.id);
                            setError(null);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700 hover:border-rose-300"
                          onClick={() => handleDelete(announcement.id)}
                          disabled={isSaving}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
                <p className="mt-4 whitespace-pre-line text-sm text-slate-700">
                  {announcement.content}
                </p>
                <div className="mt-4">
                  <a
                    href={mailto}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:border-slate-300"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    Send Message
                  </a>
                </div>
              </>
            )}
          </article>
        );
      })}
    </div>
  );
}
