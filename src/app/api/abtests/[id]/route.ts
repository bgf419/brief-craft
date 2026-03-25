import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const {
      status, notes, roas, ctr, cvr, spend, revenue,
      platform, campaignId, csvData, startDate, endDate,
    } = body;

    const test = await prisma.aBTest.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes }),
        ...(roas !== undefined && { roas }),
        ...(ctr !== undefined && { ctr }),
        ...(cvr !== undefined && { cvr }),
        ...(spend !== undefined && { spend }),
        ...(revenue !== undefined && { revenue }),
        ...(platform !== undefined && { platform }),
        ...(campaignId !== undefined && { campaignId }),
        ...(csvData !== undefined && { csvData }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
      },
      include: { project: true, author: true },
    });

    return NextResponse.json(test);
  } catch (error) {
    console.error("Failed to update A/B test:", error);
    return NextResponse.json({ error: "Failed to update A/B test" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await prisma.aBTest.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete A/B test:", error);
    return NextResponse.json({ error: "Failed to delete A/B test" }, { status: 500 });
  }
}
