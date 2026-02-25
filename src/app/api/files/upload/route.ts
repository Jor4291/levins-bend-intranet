import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 8 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    console.log("Files upload env", {
      hasSupabaseUrl: Boolean(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL),
      hasServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      bucket: process.env.SUPABASE_STORAGE_BUCKET || "intranet-files",
    });

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const name = String(formData.get("name") || "").trim();
    const category = String(formData.get("category") || "").trim();
    const organizationId = String(formData.get("organizationId") || "").trim();

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "File is required." }, { status: 400 });
    }

    if (!name || !organizationId) {
      return NextResponse.json(
        { error: "Name and organization are required." },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are allowed." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File exceeds 8MB limit." },
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
        { error: "Only org admins can upload files." },
        { status: 403 }
      );
    }

    const bucket =
      process.env.SUPABASE_STORAGE_BUCKET || "intranet-files";
    const filePath = `${organizationId}/${Date.now()}-${file.name}`;

    const upload = await supabaseAdmin.storage
      .from(bucket)
      .upload(filePath, file, {
        contentType: file.type,
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
      .getPublicUrl(filePath);

    const record = await prisma.file.create({
      data: {
        name,
        fileName: file.name,
        fileUrl: publicUrlData.publicUrl,
        fileSize: file.size,
        mimeType: file.type,
        category: category || null,
        uploadedById: session.user.id,
        organizationId,
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("File upload error", error);
    return NextResponse.json(
      { error: "Unable to upload file." },
      { status: 500 }
    );
  }
}
