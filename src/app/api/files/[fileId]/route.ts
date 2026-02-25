import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function extractStoragePath(fileUrl: string, bucket: string) {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const index = fileUrl.indexOf(marker);
  if (index === -1) return null;
  return fileUrl.slice(index + marker.length);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const fileRecord = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!fileRecord) {
      return NextResponse.json({ error: "File not found." }, { status: 404 });
    }

    const membership = await prisma.userOrganization.findFirst({
      where: {
        userId: session.user.id,
        organizationId: fileRecord.organizationId,
      },
    });

    const isAdmin =
      membership?.role === "ORG_ADMIN" || Boolean(session.user.isSystemAdmin);

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Only admins can delete files." },
        { status: 403 }
      );
    }

    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "intranet-files";
    const storagePath = extractStoragePath(fileRecord.fileUrl, bucket);

    if (storagePath) {
      const removal = await supabaseAdmin.storage
        .from(bucket)
        .remove([storagePath]);
      if (removal.error) {
        return NextResponse.json(
          { error: removal.error.message },
          { status: 500 }
        );
      }
    }

    await prisma.file.delete({
      where: { id: fileRecord.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("File delete error", error);
    return NextResponse.json(
      { error: "Unable to delete file." },
      { status: 500 }
    );
  }
}
