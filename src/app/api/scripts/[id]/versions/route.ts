import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // First find the script to determine its parentId
    const script = await prisma.script.findUnique({ where: { id } });

    if (!script) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    const parentId = script.parentId || script.id;

    // Get all versions: the original parent + all children
    const versions = await prisma.script.findMany({
      where: {
        OR: [{ id: parentId }, { parentId }],
      },
      orderBy: { version: "asc" },
      include: {
        sections: {
          orderBy: { order: "asc" },
          include: { rows: { orderBy: { order: "asc" } } },
        },
        _count: { select: { sections: true, comments: true } },
      },
    });

    return NextResponse.json(versions);
  } catch (error) {
    console.error("Failed to fetch script versions:", error);
    return NextResponse.json({ error: "Failed to fetch script versions" }, { status: 500 });
  }
}
