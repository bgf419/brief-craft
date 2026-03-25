import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

    const projects = await prisma.project.findMany({
      where: clientId ? { clientId } : undefined,
      include: {
        client: true,
        _count: { select: { scripts: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, thumbnail, type, tags, clientId } = body;

    if (!name || !clientId) {
      return NextResponse.json({ error: "Name and clientId are required" }, { status: 400 });
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        thumbnail,
        type: type || "UGC",
        tags: tags ? JSON.stringify(tags) : "[]",
        clientId,
      },
      include: { client: true },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Failed to create project:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
