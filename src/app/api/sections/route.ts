import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scriptId, title } = body;

    if (!scriptId) {
      return NextResponse.json({ error: "scriptId is required" }, { status: 400 });
    }

    // Determine the next order value
    const maxOrder = await prisma.scriptSection.aggregate({
      where: { scriptId },
      _max: { order: true },
    });

    const order = (maxOrder._max.order ?? -1) + 1;

    const section = await prisma.scriptSection.create({
      data: {
        scriptId,
        title: title || "",
        order,
      },
      include: { rows: true },
    });

    return NextResponse.json(section, { status: 201 });
  } catch (error) {
    console.error("Failed to create section:", error);
    return NextResponse.json({ error: "Failed to create section" }, { status: 500 });
  }
}
