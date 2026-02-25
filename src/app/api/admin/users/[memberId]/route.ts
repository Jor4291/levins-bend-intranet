import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { memberId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const membership = await prisma.userOrganization.findUnique({
      where: { id: memberId },
      include: { user: true },
    });

    if (!membership) {
      return NextResponse.json({ error: "Member not found." }, { status: 404 });
    }

    const adminMembership = await prisma.userOrganization.findFirst({
      where: {
        userId: session.user.id,
        organizationId: membership.organizationId,
      },
    });

    const isAdmin =
      adminMembership?.role === "ORG_ADMIN" ||
      Boolean(session.user.isSystemAdmin);

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Only org admins can manage users." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { firstName, lastName, email, role, password, passwordConfirm } =
      body ?? {};

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: "First name, last name, and email are required." },
        { status: 400 }
      );
    }

    if (password || passwordConfirm) {
      if (!password || !passwordConfirm) {
        return NextResponse.json(
          { error: "Both password fields are required." },
          { status: 400 }
        );
      }

      if (String(password).length < 8) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters." },
          { status: 400 }
        );
      }

      if (password !== passwordConfirm) {
        return NextResponse.json(
          { error: "Passwords do not match." },
          { status: 400 }
        );
      }
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existingEmail = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        NOT: { id: membership.userId },
      },
      select: { id: true },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: "That email is already in use." },
        { status: 409 }
      );
    }

    const updatedData: {
      firstName: string;
      lastName: string;
      email: string;
      passwordHash?: string;
    } = {
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      email: normalizedEmail,
    };

    if (password && passwordConfirm) {
      const bcrypt = await import("bcryptjs");
      updatedData.passwordHash = await bcrypt.hash(String(password), 10);
    }

    await prisma.user.update({
      where: { id: membership.userId },
      data: updatedData,
    });

    await prisma.userOrganization.update({
      where: { id: membership.id },
      data: {
        role: role === "ORG_ADMIN" ? "ORG_ADMIN" : "MEMBER",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin update user error", error);
    return NextResponse.json(
      { error: "Unable to update user." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { memberId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const membership = await prisma.userOrganization.findUnique({
      where: { id: memberId },
    });

    if (!membership) {
      return NextResponse.json({ error: "Member not found." }, { status: 404 });
    }

    const adminMembership = await prisma.userOrganization.findFirst({
      where: {
        userId: session.user.id,
        organizationId: membership.organizationId,
      },
    });

    const isAdmin =
      adminMembership?.role === "ORG_ADMIN" ||
      Boolean(session.user.isSystemAdmin);

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Only org admins can manage users." },
        { status: 403 }
      );
    }

    if (membership.userId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot remove yourself." },
        { status: 400 }
      );
    }

    await prisma.userOrganization.delete({
      where: { id: membership.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin remove user error", error);
    return NextResponse.json(
      { error: "Unable to remove user." },
      { status: 500 }
    );
  }
}
