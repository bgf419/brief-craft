import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "you@briefcraft.app" },
    update: {},
    create: { name: "You", email: "you@briefcraft.app" },
  });

  const client1 = await prisma.client.create({
    data: {
      name: "Acme Health",
      isFavorite: true,
      members: { create: { userId: user.id, role: "owner" } },
    },
  });

  const client2 = await prisma.client.create({
    data: {
      name: "Nova Skincare",
      members: { create: { userId: user.id, role: "owner" } },
    },
  });

  const client3 = await prisma.client.create({
    data: {
      name: "Peak Fitness",
      isFavorite: true,
      members: { create: { userId: user.id, role: "owner" } },
    },
  });

  const proj1 = await prisma.project.create({
    data: {
      name: "Q1 UGC Campaign",
      type: "UGC",
      tags: JSON.stringify(["ugc", "q1", "launch"]),
      clientId: client1.id,
    },
  });

  await prisma.project.create({
    data: {
      name: "Static Ad Refresh",
      type: "Static",
      tags: JSON.stringify(["static", "refresh"]),
      clientId: client1.id,
    },
  });

  await prisma.project.create({
    data: {
      name: "Hook Test Battery",
      type: "Hook Test",
      tags: JSON.stringify(["hooks", "testing"]),
      clientId: client2.id,
    },
  });

  await prisma.project.create({
    data: {
      name: "Concept Tests March",
      type: "Concept Test",
      tags: JSON.stringify(["concepts", "march"]),
      clientId: client3.id,
    },
  });

  const script = await prisma.script.create({
    data: { name: "UGC Testimonial - Weight Loss", version: 1, projectId: proj1.id },
  });

  const s1 = await prisma.scriptSection.create({
    data: { scriptId: script.id, title: "Hook", order: 0 },
  });
  const s2 = await prisma.scriptSection.create({
    data: { scriptId: script.id, title: "Problem / Agitation", order: 1 },
  });
  const s3 = await prisma.scriptSection.create({
    data: { scriptId: script.id, title: "Solution / CTA", order: 2 },
  });

  await prisma.scriptRow.createMany({
    data: [
      { sectionId: s1.id, order: 0, col1: "Close-up of person looking at camera, natural lighting", col2: "\"I never thought I'd say this, but I actually look forward to mornings now...\"", col3: "Film in bathroom mirror, golden hour light" },
      { sectionId: s1.id, order: 1, col1: "B-roll: product on counter with coffee", col2: "(no dialogue - ambient sound)", col3: "Use product hero shot from Google Drive" },
      { sectionId: s2.id, order: 0, col1: "Talking head, medium shot", col2: "\"For years I tried every diet, every supplement... nothing worked.\"", col3: "Show genuine emotion" },
      { sectionId: s3.id, order: 0, col1: "Product in hand, zooming in", col2: "\"Then my doctor recommended [Product]. Within 3 weeks, I felt different.\"", col3: "Transition to product close-up" },
      { sectionId: s3.id, order: 1, col1: "End card with offer", col2: "\"Use code HEALTH20 for 20% off. Link in bio.\"", col3: "Branded end card template" },
    ],
  });

  await prisma.template.createMany({
    data: [
      {
        name: "UGC Testimonial (3-Part)",
        description: "Hook → Problem → Solution structure for UGC testimonials",
        isGlobal: true,
        structure: JSON.stringify({
          sections: [
            { title: "Hook", rows: [{ col1: "Visual direction", col2: "Opening hook line", col3: "Notes" }] },
            { title: "Problem / Agitation", rows: [{ col1: "Visual direction", col2: "Pain point script", col3: "Notes" }] },
            { title: "Solution / CTA", rows: [{ col1: "Visual direction", col2: "Product pitch + CTA", col3: "Notes" }] },
          ],
        }),
      },
      {
        name: "Static Ad - Before/After",
        description: "Simple before/after static ad layout",
        isGlobal: true,
        structure: JSON.stringify({
          sections: [
            { title: "Before State", rows: [{ col1: "Before image ref", col2: "Problem headline", col3: "Subtext" }] },
            { title: "After State", rows: [{ col1: "After image ref", col2: "Transformation headline", col3: "CTA" }] },
          ],
        }),
      },
      {
        name: "Hook Test Matrix",
        description: "5 hook variants for A/B testing",
        isGlobal: true,
        structure: JSON.stringify({
          sections: [
            { title: "Hook A - Question", rows: [{ col1: "Visual", col2: "Hook A script", col3: "Notes" }] },
            { title: "Hook B - Statistic", rows: [{ col1: "Visual", col2: "Hook B script", col3: "Notes" }] },
            { title: "Hook C - Testimonial", rows: [{ col1: "Visual", col2: "Hook C script", col3: "Notes" }] },
            { title: "Hook D - Controversy", rows: [{ col1: "Visual", col2: "Hook D script", col3: "Notes" }] },
            { title: "Hook E - Demo", rows: [{ col1: "Visual", col2: "Hook E script", col3: "Notes" }] },
          ],
        }),
      },
    ],
  });

  await prisma.comment.create({
    data: {
      content: "Love this hook! Can we test a version that starts with the product reveal?",
      scriptId: script.id,
      authorId: user.id,
    },
  });

  console.log("Seed data created successfully!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
