import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const priorityValues = new Set(["LOW", "NORMAL", "HIGH", "URGENT"]);
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const formData = await request.formData();
    const title = String(formData.get("title") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const unit = String(formData.get("unit") || "").trim();
    const priority = String(formData.get("priority") || "NORMAL");
    const organizationId = String(formData.get("organizationId") || "").trim();
    const photo = formData.get("photo");

    if (!title || !description || !organizationId) {
      return NextResponse.json(
        { error: "Title, description, and organization are required." },
        { status: 400 }
      );
    }

    const membership = await prisma.userOrganization.findFirst({
      where: {
        userId: session.user.id,
        organizationId,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "You are not assigned to this organization." },
        { status: 403 }
      );
    }

    const normalizedPriority = String(priority || "NORMAL").toUpperCase();
    let photoUrl: string | null = null;
    let photoFileName: string | null = null;
    let photoMimeType: string | null = null;
    let photoSize: number | null = null;

    if (photo && photo instanceof File && photo.size > 0) {
      if (!ALLOWED_PHOTO_TYPES.has(photo.type)) {
        return NextResponse.json(
          { error: "Only JPG, PNG, WebP, or HEIC images are allowed." },
          { status: 400 }
        );
      }

      if (photo.size > MAX_PHOTO_SIZE) {
        return NextResponse.json(
          { error: "Photo exceeds 5MB limit." },
          { status: 400 }
        );
      }

      const bucket =
        process.env.SUPABASE_STORAGE_BUCKET || "intranet-files";
      const photoPath = `${organizationId}/maintenance/${Date.now()}-${
        photo.name
      }`;

      const upload = await supabaseAdmin.storage
        .from(bucket)
        .upload(photoPath, photo, {
          contentType: photo.type,
          upsert: false,
        });

      if (upload.error) {
        return NextResponse.json(
          { error: upload.error.message },
          { status: 500 }
        );
      }

      const { data: publicUrlData } = supabaseAdmin.storage
        .from(bucket)
        .getPublicUrl(photoPath);

      photoUrl = publicUrlData.publicUrl;
      photoFileName = photo.name;
      photoMimeType = photo.type;
      photoSize = photo.size;
    }

    const requestRecord = await prisma.maintenanceRequest.create({
      data: {
        title: String(title).trim(),
        description: String(description).trim(),
        unit: unit ? String(unit).trim() : null,
        photoUrl,
        photoFileName,
        photoMimeType,
        photoSize,
        priority: priorityValues.has(normalizedPriority)
          ? normalizedPriority
          : "NORMAL",
        submittedById: session.user.id,
        organizationId,
      },
    });

    return NextResponse.json(requestRecord, { status: 201 });
  } catch (error) {
    console.error("Maintenance request create error", error);
    return NextResponse.json(
      { error: "Unable to submit maintenance request." },
      { status: 500 }
    );
  }
}
