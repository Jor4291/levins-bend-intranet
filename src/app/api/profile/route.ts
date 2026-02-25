import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const formData = await request.formData();
    const firstName = String(formData.get("firstName") || "").trim();
    const lastName = String(formData.get("lastName") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const password = String(formData.get("password") || "");
    const passwordConfirm = String(formData.get("passwordConfirm") || "");
    const avatar = formData.get("avatar");

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

      if (password.length < 8) {
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

    const existingEmail = await prisma.user.findFirst({
      where: {
        email,
        NOT: { id: session.user.id },
      },
      select: { id: true },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: "That email is already in use." },
        { status: 409 }
      );
    }

    let avatarUrl: string | null = null;

    if (avatar && avatar instanceof File && avatar.size > 0) {
      if (!ALLOWED_AVATAR_TYPES.has(avatar.type)) {
        return NextResponse.json(
          { error: "Only JPG, PNG, WebP, or HEIC images are allowed." },
          { status: 400 }
        );
      }

      if (avatar.size > MAX_AVATAR_SIZE) {
        return NextResponse.json(
          { error: "Photo exceeds 5MB limit." },
          { status: 400 }
        );
      }

      const bucket = process.env.SUPABASE_STORAGE_BUCKET || "intranet-files";
      const path = `avatars/${session.user.id}/${Date.now()}-${avatar.name}`;

      const upload = await supabaseAdmin.storage
        .from(bucket)
        .upload(path, avatar, {
          contentType: avatar.type,
          upsert: true,
        });

      if (upload.error) {
        return NextResponse.json(
          { error: upload.error.message },
          { status: 500 }
        );
      }

      const { data: publicUrlData } = supabaseAdmin.storage
        .from(bucket)
        .getPublicUrl(path);

      avatarUrl = publicUrlData.publicUrl;
    }

    const updatedData: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string | null;
      avatarUrl?: string;
      passwordHash?: string;
    } = {
      firstName,
      lastName,
      email,
      phone: phone || null,
    };

    if (avatarUrl) {
      updatedData.avatarUrl = avatarUrl;
    }

    if (password && passwordConfirm) {
      const bcrypt = await import("bcryptjs");
      updatedData.passwordHash = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updatedData,
    });

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error("Profile update error", error);
    return NextResponse.json(
      { error: "Unable to update profile." },
      { status: 500 }
    );
  }
}
