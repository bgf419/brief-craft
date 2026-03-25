import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rowId = searchParams.get("rowId");
    const projectId = searchParams.get("projectId");

    const assets = await prisma.asset.findMany({
      where: {
        ...(rowId && { rowId }),
        ...(projectId && { projectId }),
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(assets);
  } catch (error) {
    console.error("Failed to fetch assets:", error);
    return NextResponse.json({ error: "Failed to fetch assets" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, url, type, tags, rowId, projectId, timestamp, note } = body;

    if (!name || !url || !type) {
      return NextResponse.json(
        { error: "name, url, and type are required" },
        { status: 400 }
      );
    }

    const asset = await prisma.asset.create({
      data: {
        name,
        url,
        type,
        tags: tags ? JSON.stringify(tags) : "[]",
        rowId,
        projectId,
        timestamp,
        note,
      },
    });

    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    console.error("Failed to create asset:", error);
    return NextResponse.json({ error: "Failed to create asset" }, { status: 500 });
  }
}
