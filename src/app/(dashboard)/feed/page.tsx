import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AnnouncementForm from "./AnnouncementForm";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function FeedPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return (
      <section className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold text-slate-900">
            Announcements
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Latest updates from your association board.
          </p>
        </header>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">
            Please sign in to view announcements.
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
          <h1 className="text-2xl font-semibold text-slate-900">
            Announcements
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Latest updates from your association board.
          </p>
        </header>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">
            You are not assigned to an organization yet.
          </p>
        </div>
      </section>
    );
  }

  const announcements = await prisma.announcement.findMany({
    where: { organizationId: membership.organizationId },
    include: { author: true },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
  });

  const canPost =
    membership.role === "ORG_ADMIN" || Boolean(session.user.isSystemAdmin);

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Announcements
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Latest updates from your association board.
          </p>
        </div>
      </header>

      {canPost ? (
        <AnnouncementForm organizationId={membership.organizationId} />
      ) : null}

      {announcements.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">
            No announcements yet. Check back soon.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => {
            const authorName = `${announcement.author.firstName} ${announcement.author.lastName}`;
            const mailto = `mailto:${announcement.author.email}?subject=${encodeURIComponent(
              `Re: ${announcement.title}`
            )}&body=${encodeURIComponent(
              `Regarding your announcement "${announcement.title}":\n\n`
            )}`;

            return (
              <article
                key={announcement.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      {announcement.title}
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      {authorName} · {formatDate(announcement.createdAt)}
                    </p>
                  </div>
                  {announcement.isPinned ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      Pinned
                    </span>
                  ) : null}
                </div>
                <p className="mt-4 whitespace-pre-line text-sm text-slate-700">
                  {announcement.content}
                </p>
                <div className="mt-4">
                  <a
                    href={mailto}
                    className="text-sm font-medium text-slate-700 hover:text-slate-900"
                  >
                    Contact organizer
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
