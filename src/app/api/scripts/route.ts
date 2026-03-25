import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const scripts = await prisma.script.findMany({
      where: { projectId },
      include: {
        _count: { select: { sections: true, comments: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(scripts);
  } catch (error) {
    console.error("Failed to fetch scripts:", error);
    return NextResponse.json({ error: "Failed to fetch scripts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, projectId } = body;

    if (!name || !projectId) {
      return NextResponse.json({ error: "Name and projectId are required" }, { status: 400 });
    }

    const script = await prisma.script.create({
      data: { name, projectId },
      include: {
        sections: { include: { rows: true } },
      },
    });

    return NextResponse.json(script, { status: 201 });
  } catch (error) {
    console.error("Failed to create script:", error);
    return NextResponse.json({ error: "Failed to create script" }, { status: 500 });
  }
}
