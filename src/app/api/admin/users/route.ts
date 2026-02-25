import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function generateTempPassword(length = 12) {
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  let result = "";
  for (let i = 0; i < length; i += 1) {
    result += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return result;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const { firstName, lastName, email, role, organizationId } = body ?? {};

    if (!firstName || !lastName || !email || !organizationId) {
      return NextResponse.json(
        { error: "First name, last name, email, and organization are required." },
        { status: 400 }
      );
    }

    const membership = await prisma.userOrganization.findFirst({
      where: { userId: session.user.id, organizationId },
    });

    const isAdmin =
      membership?.role === "ORG_ADMIN" || Boolean(session.user.isSystemAdmin);

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Only org admins can manage users." },
        { status: 403 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with that email already exists." },
        { status: 409 }
      );
    }

    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const newUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
      },
    });

    await prisma.userOrganization.create({
      data: {
        userId: newUser.id,
        organizationId,
        role: role === "ORG_ADMIN" ? "ORG_ADMIN" : "MEMBER",
      },
    });

    return NextResponse.json(
      {
        email: normalizedEmail,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: role === "ORG_ADMIN" ? "ORG_ADMIN" : "MEMBER",
        tempPassword,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin create user error", error);
    return NextResponse.json(
      { error: "Unable to create user." },
      { status: 500 }
    );
  }
}
