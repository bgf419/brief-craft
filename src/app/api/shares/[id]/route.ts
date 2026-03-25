import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { accessLevel, password, clientView, expiresAt } = body;

    const share = await prisma.share.update({
      where: { id },
      data: {
        ...(accessLevel !== undefined && { accessLevel }),
        ...(password !== undefined && { password }),
        ...(clientView !== undefined && { clientView }),
        ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
      },
      include: { user: true, project: true },
    });

    return NextResponse.json(share);
  } catch (error) {
    console.error("Failed to update share:", error);
    return NextResponse.json({ error: "Failed to update share" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await prisma.share.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete share:", error);
    return NextResponse.json({ error: "Failed to delete share" }, { status: 500 });
  }
}
