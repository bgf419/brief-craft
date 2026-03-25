import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scriptId, format } = body as {
      scriptId: string;
      format: "html" | "csv" | "text";
    };

    if (!scriptId || !format) {
      return NextResponse.json(
        { error: "scriptId and format are required" },
        { status: 400 }
      );
    }

    const script = await prisma.script.findUnique({
      where: { id: scriptId },
      include: {
        project: { include: { client: true } },
        sections: {
          orderBy: { order: "asc" },
          include: {
            rows: { orderBy: { order: "asc" } },
          },
        },
      },
    });

    if (!script) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    if (format === "html") {
      const sectionsHtml = script.sections
        .map((section) => {
          const rowsHtml = section.rows
            .map(
              (row) => `
            <tr>
              <td style="border:1px solid #ddd;padding:8px;">${escapeHtml(row.col1)}</td>
              <td style="border:1px solid #ddd;padding:8px;">${escapeHtml(row.col2)}</td>
              <td style="border:1px solid #ddd;padding:8px;">${escapeHtml(row.col3)}</td>
            </tr>`
            )
            .join("\n");

          return `
          <div style="margin-bottom:24px;">
            <h2 style="color:#333;border-bottom:2px solid #4f46e5;padding-bottom:4px;">${escapeHtml(section.title || "Untitled Section")}</h2>
            <table style="width:100%;border-collapse:collapse;margin-top:8px;">
              <thead>
                <tr style="background:#f3f4f6;">
                  <th style="border:1px solid #ddd;padding:8px;text-align:left;">Visual / Direction</th>
                  <th style="border:1px solid #ddd;padding:8px;text-align:left;">Voiceover / Script</th>
                  <th style="border:1px solid #ddd;padding:8px;text-align:left;">Notes</th>
                </tr>
              </thead>
              <tbody>${rowsHtml}</tbody>
            </table>
          </div>`;
        })
        .join("\n");

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(script.name)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 960px; margin: 0 auto; padding: 40px 20px; color: #111; }
    h1 { font-size: 28px; margin-bottom: 4px; }
    .meta { color: #666; font-size: 14px; margin-bottom: 32px; }
  </style>
</head>
<body>
  <h1>${escapeHtml(script.name)}</h1>
  <div class="meta">
    ${script.project.client ? escapeHtml(script.project.client.name) + " &mdash; " : ""}${escapeHtml(script.project.name)} &mdash; Version ${script.version}
  </div>
  ${sectionsHtml}
</body>
</html>`;

      return new NextResponse(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `attachment; filename="${script.name}.html"`,
        },
      });
    }

    if (format === "csv") {
      const lines: string[] = ["Section,Visual / Direction,Voiceover / Script,Notes"];

      for (const section of script.sections) {
        for (const row of section.rows) {
          lines.push(
            [
              csvEscape(section.title || "Untitled"),
              csvEscape(row.col1),
              csvEscape(row.col2),
              csvEscape(row.col3),
            ].join(",")
          );
        }
      }

      const csv = lines.join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${script.name}.csv"`,
        },
      });
    }

    if (format === "text") {
      const lines: string[] = [
        script.name,
        `Version ${script.version}`,
        "=".repeat(50),
        "",
      ];

      for (const section of script.sections) {
        lines.push(`## ${section.title || "Untitled Section"}`);
        lines.push("-".repeat(40));
        for (const row of section.rows) {
          if (row.col1) lines.push(`[Visual] ${row.col1}`);
          if (row.col2) lines.push(`[Script] ${row.col2}`);
          if (row.col3) lines.push(`[Notes]  ${row.col3}`);
          lines.push("");
        }
        lines.push("");
      }

      const text = lines.join("\n");

      return new NextResponse(text, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": `attachment; filename="${script.name}.txt"`,
        },
      });
    }

    return NextResponse.json(
      { error: "Invalid format. Use html, csv, or text." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Failed to export script:", error);
    return NextResponse.json({ error: "Failed to export script" }, { status: 500 });
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function csvEscape(str: string): string {
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
