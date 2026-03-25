import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const original = await prisma.script.findUnique({
      where: { id },
      include: {
        sections: {
          orderBy: { order: "asc" },
          include: {
            rows: { orderBy: { order: "asc" } },
          },
        },
      },
    });

    if (!original) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    // Determine the new version number
    const parentId = original.parentId || original.id;
    const maxVersion = await prisma.script.aggregate({
      where: {
        OR: [{ id: parentId }, { parentId }],
      },
      _max: { version: true },
    });

    const newVersion = (maxVersion._max.version || 1) + 1;

    // Create the duplicated script with all sections and rows
    const duplicated = await prisma.script.create({
      data: {
        name: `${original.name} (v${newVersion})`,
        version: newVersion,
        parentId,
        projectId: original.projectId,
        sections: {
          create: original.sections.map((section) => ({
            title: section.title,
            order: section.order,
            rows: {
              create: section.rows.map((row) => ({
                order: row.order,
                col1: row.col1,
                col2: row.col2,
                col3: row.col3,
              })),
            },
          })),
        },
      },
      include: {
        sections: {
          include: { rows: true },
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json(duplicated, { status: 201 });
  } catch (error) {
    console.error("Failed to duplicate script:", error);
    return NextResponse.json({ error: "Failed to duplicate script" }, { status: 500 });
  }
}
