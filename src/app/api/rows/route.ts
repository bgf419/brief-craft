import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sectionId, col1, col2, col3 } = body;

    if (!sectionId) {
      return NextResponse.json({ error: "sectionId is required" }, { status: 400 });
    }

    const maxOrder = await prisma.scriptRow.aggregate({
      where: { sectionId },
      _max: { order: true },
    });

    const order = (maxOrder._max.order ?? -1) + 1;

    const row = await prisma.scriptRow.create({
      data: {
        sectionId,
        order,
        col1: col1 || "",
        col2: col2 || "",
        col3: col3 || "",
      },
      include: { assets: true },
    });

    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    console.error("Failed to create row:", error);
    return NextResponse.json({ error: "Failed to create row" }, { status: 500 });
  }
}
