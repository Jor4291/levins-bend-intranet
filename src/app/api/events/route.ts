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
    const {
      title,
      description,
      location,
      startDate,
      endDate,
      isAllDay,
      organizationId,
    } = body ?? {};

    if (!title || !startDate || !organizationId) {
      return NextResponse.json(
        { error: "Title, start date, and organization are required." },
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
        { error: "Only org admins can create events." },
        { status: 403 }
      );
    }

    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;

    if (Number.isNaN(start.getTime())) {
      return NextResponse.json(
        { error: "Start date is invalid." },
        { status: 400 }
      );
    }

    if (end && Number.isNaN(end.getTime())) {
      return NextResponse.json(
        { error: "End date is invalid." },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        title: String(title).trim(),
        description: description ? String(description).trim() : null,
        location: location ? String(location).trim() : null,
        startDate: start,
        endDate: end,
        isAllDay: Boolean(isAllDay),
        createdById: session.user.id,
        organizationId,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("Event create error", error);
    return NextResponse.json(
      { error: "Unable to create event." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      title,
      description,
      location,
      startDate,
      endDate,
      isAllDay,
    } = body ?? {};

    if (!id || !title || !startDate) {
      return NextResponse.json(
        { error: "Event, title, and start date are required." },
        { status: 400 }
      );
    }

    const existingEvent = await prisma.event.findUnique({
      where: { id: String(id) },
    });

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    const isSystemAdmin = Boolean(session.user.isSystemAdmin);
    if (!isSystemAdmin) {
      const membership = await prisma.userOrganization.findFirst({
        where: {
          userId: session.user.id,
          organizationId: existingEvent.organizationId,
        },
      });

      if (membership?.role !== "ORG_ADMIN") {
        return NextResponse.json(
          { error: "Only org admins can update events." },
          { status: 403 }
        );
      }
    }

    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;

    if (Number.isNaN(start.getTime())) {
      return NextResponse.json(
        { error: "Start date is invalid." },
        { status: 400 }
      );
    }

    if (end && Number.isNaN(end.getTime())) {
      return NextResponse.json(
        { error: "End date is invalid." },
        { status: 400 }
      );
    }

    const updatedEvent = await prisma.event.update({
      where: { id: existingEvent.id },
      data: {
        title: String(title).trim(),
        description: description ? String(description).trim() : null,
        location: location ? String(location).trim() : null,
        startDate: start,
        endDate: end,
        isAllDay: Boolean(isAllDay),
      },
    });

    return NextResponse.json(updatedEvent, { status: 200 });
  } catch (error) {
    console.error("Event update error", error);
    return NextResponse.json(
      { error: "Unable to update event." },
      { status: 500 }
    );
  }
}
