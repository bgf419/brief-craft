import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { items } = body as { items: { id: string; order: number }[] };

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "items array with {id, order} is required" },
        { status: 400 }
      );
    }

    await prisma.$transaction(
      items.map((item) =>
        prisma.scriptSection.update({
          where: { id: item.id },
          data: { order: item.order },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to reorder sections:", error);
    return NextResponse.json({ error: "Failed to reorder sections" }, { status: 500 });
  }
}
