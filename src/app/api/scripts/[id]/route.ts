import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const script = await prisma.script.findUnique({
      where: { id },
      include: {
        sections: {
          orderBy: { order: "asc" },
          include: {
            rows: {
              orderBy: { order: "asc" },
              include: { assets: true, comments: true },
            },
          },
        },
        comments: {
          orderBy: { createdAt: "desc" },
          include: {
            author: true,
            replies: { include: { author: true } },
          },
        },
        project: true,
      },
    });

    if (!script) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    return NextResponse.json(script);
  } catch (error) {
    console.error("Failed to fetch script:", error);
    return NextResponse.json({ error: "Failed to fetch script" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name } = body;

    const script = await prisma.script.update({
      where: { id },
      data: { ...(name !== undefined && { name }) },
    });

    return NextResponse.json(script);
  } catch (error) {
    console.error("Failed to update script:", error);
    return NextResponse.json({ error: "Failed to update script" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await prisma.script.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete script:", error);
    return NextResponse.json({ error: "Failed to delete script" }, { status: 500 });
  }
}
