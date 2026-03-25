import { NextRequest, NextResponse } from "next/server";

const HEADLINE_TEMPLATES = [
  "The {adjective} way to {benefit}",
  "{Number} {adjective} reasons to {benefit}",
  "How to {benefit} without {pain_point}",
  "Why {audience} are switching to {product}",
  "The secret to {benefit} that nobody talks about",
  "Stop {pain_point}. Start {benefit}.",
  "What {audience} wish they knew about {benefit}",
  "Finally, a {adjective} solution for {pain_point}",
  "{Benefit} in just {timeframe} — guaranteed",
  "The {adjective} guide to {benefit} for {audience}",
];

const HOOK_TEMPLATES = [
  "What if I told you {benefit} was easier than you think?",
  "Nobody talks about this, but {insight}...",
  "I spent {timeframe} figuring out {benefit}, so you don't have to.",
  "Here's the thing about {topic} that everyone gets wrong...",
  "You're probably making this {topic} mistake right now.",
  "POV: You just discovered {benefit}.",
  "3 seconds. That's all you need to understand {topic}.",
  "Wait — did you know {surprising_fact}?",
  "The biggest lie about {topic}? That it's {misconception}.",
  "I wish someone told me this about {topic} sooner.",
];

const CTA_TEMPLATES = [
  "Get yours before they're gone",
  "Start your {benefit} journey today",
  "Try it free for {timeframe}",
  "Join {number}+ {audience} who already {benefit}",
  "Claim your {offer} now",
  "Don't wait — {urgency_reason}",
  "See why {audience} love it — tap the link",
  "Ready to {benefit}? Let's go.",
  "Your {benefit} starts here",
  "Get instant access — link in bio",
];

const OFFER_TEMPLATES = [
  "Save {percentage}% today only",
  "Buy one, get one {deal}",
  "Free {bonus} with every order",
  "First {number} customers get {exclusive}",
  "{Percentage}% off for the next {timeframe}",
  "Unlock {benefit} for just ${price}/month",
  "Use code {code} for {percentage}% off",
  "Limited time: {offer_detail}",
  "Early bird pricing — save ${amount}",
  "Bundle and save {percentage}%",
];

function fillTemplate(template: string, context: string): string {
  const contextWords = context.toLowerCase().split(/\s+/);
  const topic = context.length > 0 ? context : "your goals";

  const replacements: Record<string, string[]> = {
    "{adjective}": ["proven", "simple", "powerful", "effortless", "smart", "ultimate"],
    "{benefit}": [
      `achieving ${topic}`,
      `mastering ${topic}`,
      `unlocking ${topic}`,
      `transforming ${topic}`,
    ],
    "{pain_point}": [
      "wasting time",
      "the guesswork",
      "overspending",
      "the hassle",
      "burning out",
    ],
    "{audience}": ["creators", "brands", "marketers", "professionals", "teams"],
    "{product}": [`this ${topic} solution`, "this approach", "this method"],
    "{insight}": [
      `${topic} doesn't have to be complicated`,
      `most people overthink ${topic}`,
      `the key to ${topic} is simpler than you think`,
    ],
    "{topic}": [topic],
    "{timeframe}": ["30 days", "7 days", "24 hours", "5 minutes", "one week"],
    "{surprising_fact}": [
      `90% of people get ${topic} wrong`,
      `${topic} can be automated`,
      `you only need 3 steps for ${topic}`,
    ],
    "{misconception}": ["hard", "expensive", "time-consuming", "complicated"],
    "{number}": ["10,000", "50,000", "5,000", "100,000"],
    "{Number}": ["5", "7", "10", "3"],
    "{urgency_reason}": [
      "this offer ends tonight",
      "spots are limited",
      "prices go up tomorrow",
    ],
    "{offer}": ["exclusive deal", "free trial", "special offer", "VIP access"],
    "{percentage}": ["20", "30", "40", "50", "25"],
    "{Percentage}": ["20", "30", "40", "50", "25"],
    "{deal}": ["free", "half off", "at 50% off"],
    "{bonus}": ["gift", "bonus item", "starter kit", "resource pack"],
    "{exclusive}": ["free shipping", "a bonus gift", "priority access", "VIP support"],
    "{price}": ["9", "19", "29", "49"],
    "{amount}": ["50", "100", "25", "75"],
    "{code}": [
      contextWords[0]?.toUpperCase() || "SAVE",
      "LAUNCH",
      "VIP",
      "EARLY",
    ],
    "{offer_detail}": [
      `${topic} starter pack at half price`,
      "free premium upgrade",
      "double your credits",
    ],
    "{Benefit}": [
      `Better ${topic}`,
      `Effortless ${topic}`,
      `Next-level ${topic}`,
    ],
  };

  let filled = template;
  for (const [placeholder, options] of Object.entries(replacements)) {
    while (filled.includes(placeholder)) {
      const pick = options[Math.floor(Math.random() * options.length)];
      filled = filled.replace(placeholder, pick);
    }
  }

  return filled;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, context, count } = body as {
      type: "headline" | "hook" | "offer" | "cta";
      context: string;
      count: number;
    };

    if (!type) {
      return NextResponse.json({ error: "type is required" }, { status: 400 });
    }

    const numResults = Math.min(count || 5, 20);
    const ctx = context || "";

    let templates: string[];
    switch (type) {
      case "headline":
        templates = HEADLINE_TEMPLATES;
        break;
      case "hook":
        templates = HOOK_TEMPLATES;
        break;
      case "cta":
        templates = CTA_TEMPLATES;
        break;
      case "offer":
        templates = OFFER_TEMPLATES;
        break;
      default:
        return NextResponse.json({ error: "Invalid type. Use headline, hook, cta, or offer." }, { status: 400 });
    }

    const suggestions: string[] = [];
    const usedIndices = new Set<number>();

    for (let i = 0; i < numResults; i++) {
      let idx: number;
      if (usedIndices.size < templates.length) {
        do {
          idx = Math.floor(Math.random() * templates.length);
        } while (usedIndices.has(idx));
        usedIndices.add(idx);
      } else {
        idx = Math.floor(Math.random() * templates.length);
      }

      suggestions.push(fillTemplate(templates[idx], ctx));
    }

    return NextResponse.json({ type, suggestions });
  } catch (error) {
    console.error("Failed to generate suggestions:", error);
    return NextResponse.json({ error: "Failed to generate suggestions" }, { status: 500 });
  }
}
