import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { col1, col2, col3, order } = body;

    const row = await prisma.scriptRow.update({
      where: { id },
      data: {
        ...(col1 !== undefined && { col1 }),
        ...(col2 !== undefined && { col2 }),
        ...(col3 !== undefined && { col3 }),
        ...(order !== undefined && { order }),
      },
      include: { assets: true },
    });

    return NextResponse.json(row);
  } catch (error) {
    console.error("Failed to update row:", error);
    return NextResponse.json({ error: "Failed to update row" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await prisma.scriptRow.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete row:", error);
    return NextResponse.json({ error: "Failed to delete row" }, { status: 500 });
  }
}
