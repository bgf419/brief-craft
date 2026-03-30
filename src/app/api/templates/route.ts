import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const templates = await prisma.template.findMany({
      include: { project: true },
      orderBy: { createdAt: "desc" },
    });

    // Map project type to top-level for frontend compatibility
    const mapped = templates.map((t) => ({
      ...t,
      type: t.project?.type || "",
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("Failed to fetch templates:", error);
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { name, description, structure } = body;
    const { projectId, isGlobal } = body;

    // If only projectId is provided (e.g. "Save Current as Template"),
    // build the template from the project's first script
    if (projectId && !structure) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          scripts: {
            take: 1,
            orderBy: { updatedAt: "desc" },
            include: {
              sections: {
                orderBy: { order: "asc" },
                include: { rows: { orderBy: { order: "asc" } } },
              },
            },
          },
        },
      });

      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }

      const script = project.scripts[0];
      if (!script) {
        return NextResponse.json({ error: "No scripts in project to save as template" }, { status: 400 });
      }

      name = name || `${project.name} Template`;
      description = description || `Template created from ${project.name}`;
      structure = JSON.stringify({
        sections: script.sections.map((s) => ({
          title: s.title,
          rows: s.rows.map((r) => ({
            col1: r.col1,
            col2: r.col2,
            col3: r.col3,
          })),
        })),
      });
    }

    if (!name || !structure) {
      return NextResponse.json(
        { error: "name and structure are required" },
        { status: 400 }
      );
    }

    const template = await prisma.template.create({
      data: {
        name,
        description,
        structure: typeof structure === "string" ? structure : JSON.stringify(structure),
        projectId,
        isGlobal: isGlobal ?? false,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("Failed to create template:", error);
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}
