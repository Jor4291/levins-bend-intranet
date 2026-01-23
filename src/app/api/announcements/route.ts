import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, isPinned, organizationId } = body ?? {};

    if (!title || !content || !organizationId) {
      return NextResponse.json(
        { error: "Title, content, and organization are required." },
        { status: 400 }
      );
    }

    const membership = await prisma.userOrganization.findFirst({
      where: {
        userId: session.user.id,
        organizationId,
      },
    });

    const isSystemAdmin = Boolean(session.user.isSystemAdmin);
    const isOrgAdmin = membership?.role === "ORG_ADMIN";

    if (!isSystemAdmin && !isOrgAdmin) {
      return NextResponse.json(
        { error: "Only org admins can post announcements." },
        { status: 403 }
      );
    }

    const announcement = await prisma.announcement.create({
      data: {
        title: String(title).trim(),
        content: String(content).trim(),
        isPinned: Boolean(isPinned),
        authorId: session.user.id,
        organizationId,
      },
    });

    return NextResponse.json(announcement, { status: 201 });
  } catch (error) {
    console.error("Announcement create error", error);
    return NextResponse.json(
      { error: "Unable to create announcement." },
      { status: 500 }
    );
  }
}
