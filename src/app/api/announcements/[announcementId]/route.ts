import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ announcementId: string }> }
) {
  try {
    const { announcementId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId },
    });

    if (!announcement) {
      return NextResponse.json(
        { error: "Announcement not found." },
        { status: 404 }
      );
    }

    const membership = await prisma.userOrganization.findFirst({
      where: {
        userId: session.user.id,
        organizationId: announcement.organizationId,
      },
    });

    const isAdmin =
      membership?.role === "ORG_ADMIN" || Boolean(session.user.isSystemAdmin);

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Only admins can edit announcements." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, content, isPinned } = body ?? {};

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required." },
        { status: 400 }
      );
    }

    const updated = await prisma.announcement.update({
      where: { id: announcement.id },
      data: {
        title: String(title).trim(),
        content: String(content).trim(),
        isPinned: Boolean(isPinned),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Announcement update error", error);
    return NextResponse.json(
      { error: "Unable to update announcement." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ announcementId: string }> }
) {
  try {
    const { announcementId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId },
    });

    if (!announcement) {
      return NextResponse.json(
        { error: "Announcement not found." },
        { status: 404 }
      );
    }

    const membership = await prisma.userOrganization.findFirst({
      where: {
        userId: session.user.id,
        organizationId: announcement.organizationId,
      },
    });

    const isAdmin =
      membership?.role === "ORG_ADMIN" || Boolean(session.user.isSystemAdmin);

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Only admins can delete announcements." },
        { status: 403 }
      );
    }

    await prisma.announcement.delete({
      where: { id: announcement.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Announcement delete error", error);
    return NextResponse.json(
      { error: "Unable to delete announcement." },
      { status: 500 }
    );
  }
}
