import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MaintenanceStatus } from "@prisma/client";

const statusValues = new Set(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const record = await prisma.maintenanceRequest.findUnique({
      where: { id: requestId },
    });

    if (!record) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }

    const membership = await prisma.userOrganization.findFirst({
      where: {
        userId: session.user.id,
        organizationId: record.organizationId,
      },
    });

    const isAdmin =
      membership?.role === "ORG_ADMIN" || Boolean(session.user.isSystemAdmin);

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Only admins can update maintenance status." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { status } = body ?? {};
    const normalizedStatus = String(status || "").toUpperCase();

    if (!statusValues.has(normalizedStatus)) {
      return NextResponse.json(
        { error: "Invalid status value." },
        { status: 400 }
      );
    }

    const updated = await prisma.maintenanceRequest.update({
      where: { id: record.id },
      data: { status: normalizedStatus as MaintenanceStatus },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Maintenance status update error", error);
    return NextResponse.json(
      { error: "Unable to update status." },
      { status: 500 }
    );
  }
}
