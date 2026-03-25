import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const shares = await prisma.share.findMany({
      where: { projectId },
      include: { user: true, project: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(shares);
  } catch (error) {
    console.error("Failed to fetch shares:", error);
    return NextResponse.json({ error: "Failed to fetch shares" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, userId, email, accessLevel, password, clientView, expiresAt } = body;

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const linkToken = randomUUID();

    const share = await prisma.share.create({
      data: {
        projectId,
        userId,
        email,
        accessLevel: accessLevel || "view",
        password,
        linkToken,
        clientView: clientView ?? false,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      },
      include: { user: true, project: true },
    });

    return NextResponse.json(share, { status: 201 });
  } catch (error) {
    console.error("Failed to create share:", error);
    return NextResponse.json({ error: "Failed to create share" }, { status: 500 });
  }
}
