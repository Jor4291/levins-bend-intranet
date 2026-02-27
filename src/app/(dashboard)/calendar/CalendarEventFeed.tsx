"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startDate: string;
  endDate: string | null;
  isAllDay: boolean;
};

type CalendarEventFeedProps = {
  events: CalendarEvent[];
  canEdit: boolean;
};

function formatDateTime(value: string, isAllDay: boolean) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  if (isAllDay) {
    return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
      date
    );
  }
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function toDateTimeLocalValue(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export default function CalendarEventFeed({
  events,
  canEdit,
}: CalendarEventFeedProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"UPCOMING" | "ARCHIVED" | "ALL">(
    "UPCOMING"
  );

  async function handleUpdate(
    event: React.FormEvent<HTMLFormElement>,
    eventId: string
  ) {
    event.preventDefault();
    const form = event.currentTarget;
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(form);
    const payload = {
      id: eventId,
      title: String(formData.get("title") || "").trim(),
      description: String(formData.get("description") || "").trim(),
      location: String(formData.get("location") || "").trim(),
      startDate: String(formData.get("startDate") || ""),
      endDate: String(formData.get("endDate") || ""),
      isAllDay: formData.get("isAllDay") === "on",
    };

    const response = await fetch("/api/events", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error || "Unable to update event.");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    setEditingId(null);
    router.refresh();
  }

  async function handleDelete(eventId: string) {
    if (!confirm("Delete this event? This cannot be undone.")) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const response = await fetch("/api/events", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: eventId }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error || "Unable to delete event.");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    router.refresh();
  }

  const now = Date.now();
  const filteredEvents = events.filter((event) => {
    const endTimestamp = event.endDate
      ? new Date(event.endDate).getTime()
      : new Date(event.startDate).getTime();
    const isArchived = !Number.isNaN(endTimestamp) && endTimestamp < now;
    if (statusFilter === "ALL") return true;
    if (statusFilter === "ARCHIVED") return isArchived;
    return !isArchived;
  });

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Event feed</h2>
            <p className="mt-1 text-xs text-slate-500">
              Upcoming events in chronological order.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <label htmlFor="eventFilter" className="text-slate-500">
              Filter
            </label>
            <select
              id="eventFilter"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "UPCOMING" | "ARCHIVED" | "ALL")
              }
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700"
            >
              <option value="UPCOMING">Upcoming</option>
              <option value="ARCHIVED">Archived</option>
              <option value="ALL">All</option>
            </select>
          </div>
        </div>
      </div>
      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-xs text-rose-700">
          {error}
        </div>
      ) : null}
      {filteredEvents.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          No events match this filter.
        </div>
      ) : null}
      {filteredEvents.map((event) => {
        const isEditing = editingId === event.id;
        const endTimestamp = event.endDate
          ? new Date(event.endDate).getTime()
          : new Date(event.startDate).getTime();
        const isArchived = !Number.isNaN(endTimestamp) && endTimestamp < now;
        return (
          <div
            key={event.id}
            id={`event-${event.id}`}
            className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            {isEditing ? (
              <form onSubmit={(e) => handleUpdate(e, event.id)}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <label
                        className="text-sm font-medium text-slate-700"
                        htmlFor={`title-${event.id}`}
                      >
                        Title
                      </label>
                      <input
                        id={`title-${event.id}`}
                        name="title"
                        type="text"
                        required
                        defaultValue={event.title}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        className="text-sm font-medium text-slate-700"
                        htmlFor={`startDate-${event.id}`}
                      >
                        Start
                      </label>
                      <input
                        id={`startDate-${event.id}`}
                        name="startDate"
                        type="datetime-local"
                        required
                        defaultValue={toDateTimeLocalValue(event.startDate)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        className="text-sm font-medium text-slate-700"
                        htmlFor={`endDate-${event.id}`}
                      >
                        End (optional)
                      </label>
                      <input
                        id={`endDate-${event.id}`}
                        name="endDate"
                        type="datetime-local"
                        defaultValue={
                          event.endDate ? toDateTimeLocalValue(event.endDate) : ""
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label
                        className="text-sm font-medium text-slate-700"
                        htmlFor={`location-${event.id}`}
                      >
                        Location (optional)
                      </label>
                      <input
                        id={`location-${event.id}`}
                        name="location"
                        type="text"
                        defaultValue={event.location ?? ""}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label
                        className="text-sm font-medium text-slate-700"
                        htmlFor={`description-${event.id}`}
                      >
                        Description (optional)
                      </label>
                      <textarea
                        id={`description-${event.id}`}
                        name="description"
                        rows={3}
                        defaultValue={event.description ?? ""}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-slate-600 md:col-span-2">
                      <input
                        type="checkbox"
                        name="isAllDay"
                        defaultChecked={event.isAllDay}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      All day event
                    </label>
                  </div>

                  {error ? (
                    <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                      {error}
                    </p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                      {isSubmitting ? "Saving..." : "Save changes"}
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
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
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {event.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDateTime(event.startDate, event.isAllDay)}
                      {event.endDate
                        ? ` → ${formatDateTime(event.endDate, event.isAllDay)}`
                        : ""}
                    </p>
                    {event.location ? (
                      <p className="mt-1 text-xs text-slate-500">
                        {event.location}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    {isArchived ? (
                      <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-500">
                        Archived
                      </span>
                    ) : null}
                    {event.isAllDay ? (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        All day
                      </span>
                    ) : null}
                    {canEdit ? (
                      <>
                        <button
                          type="button"
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          onClick={() => {
                            setEditingId(event.id);
                            setError(null);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50"
                          onClick={() => handleDelete(event.id)}
                          disabled={isSubmitting}
                        >
                          Delete
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
                {event.description ? (
                  <p className="mt-3 text-sm text-slate-700">
                    {event.description}
                  </p>
                ) : null}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
