import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const tests = await prisma.aBTest.findMany({
      where: { projectId },
      include: { project: true, author: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tests);
  } catch (error) {
    console.error("Failed to fetch A/B tests:", error);
    return NextResponse.json({ error: "Failed to fetch A/B tests" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, scriptIds, projectId, authorId, platform, campaignId, startDate } = body;

    if (!name || !scriptIds || !projectId) {
      return NextResponse.json(
        { error: "name, scriptIds, and projectId are required" },
        { status: 400 }
      );
    }

    const test = await prisma.aBTest.create({
      data: {
        name,
        scriptIds: typeof scriptIds === "string" ? scriptIds : JSON.stringify(scriptIds),
        projectId,
        authorId,
        platform,
        campaignId,
        startDate: startDate ? new Date(startDate) : undefined,
      },
      include: { project: true, author: true },
    });

    return NextResponse.json(test, { status: 201 });
  } catch (error) {
    console.error("Failed to create A/B test:", error);
    return NextResponse.json({ error: "Failed to create A/B test" }, { status: 500 });
  }
}
