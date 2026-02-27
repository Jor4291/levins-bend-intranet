import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AnnouncementForm from "./AnnouncementForm";
import AnnouncementList from "./AnnouncementList";

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
            Latest updates from the Levin's Bend board.
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
            Latest updates from the Levin's Bend board.
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
            Latest updates from the Levin's Bend board.
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
        <AnnouncementList
          canManage={canPost}
          announcements={announcements.map((announcement) => ({
            id: announcement.id,
            title: announcement.title,
            content: announcement.content,
            isPinned: announcement.isPinned,
            createdAt: formatDate(announcement.createdAt),
            author: {
              firstName: announcement.author.firstName,
              lastName: announcement.author.lastName,
              email: announcement.author.email,
              avatarUrl: announcement.author.avatarUrl,
            },
          }))}
        />
      )}
    </section>
  );
}
