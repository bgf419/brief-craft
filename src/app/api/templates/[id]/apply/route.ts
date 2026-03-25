import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface TemplateRow {
  col1?: string;
  col2?: string;
  col3?: string;
}

interface TemplateSection {
  title: string;
  rows: TemplateRow[];
}

interface TemplateStructure {
  sections: TemplateSection[];
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { projectId, name } = body;

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const template = await prisma.template.findUnique({ where: { id } });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const structure: TemplateStructure = JSON.parse(template.structure);

    const script = await prisma.script.create({
      data: {
        name: name || template.name,
        projectId,
        sections: {
          create: (structure.sections || []).map(
            (section: TemplateSection, sIdx: number) => ({
              title: section.title || "",
              order: sIdx,
              rows: {
                create: (section.rows || []).map(
                  (row: TemplateRow, rIdx: number) => ({
                    order: rIdx,
                    col1: row.col1 || "",
                    col2: row.col2 || "",
                    col3: row.col3 || "",
                  })
                ),
              },
            })
          ),
        },
      },
      include: {
        sections: {
          orderBy: { order: "asc" },
          include: { rows: { orderBy: { order: "asc" } } },
        },
      },
    });

    return NextResponse.json(script, { status: 201 });
  } catch (error) {
    console.error("Failed to apply template:", error);
    return NextResponse.json({ error: "Failed to apply template" }, { status: 500 });
  }
}
