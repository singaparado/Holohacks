// Vercel serverless function — /api/fix
// Holds the API key server-side. Frontend never talks to Anthropic directly.

function buildSystemPrompt(category, level) {
  const categoryFraming = {
    fix:   "The user is repairing or troubleshooting something physical (appliance, furniture, electronics, vehicle, household system).",
    cook:  "The user is cooking. Treat ingredients on hand as fixed constraints, don't assume a fully stocked kitchen or ingredients they didn't mention.",
    build: "The user is assembling or building something (furniture, a project, a setup). Missing parts or unclear instructions are the norm, help them adapt rather than insisting they find the 'right' missing piece first.",
    solve: "The user has a small everyday practical problem that doesn't fit a repair or recipe (packing, organizing, cleaning, a workaround, a logistics snag). Give practical, concrete guidance, not generic life advice.",
    learn: "The user wants to learn a practical skill, not just complete one task. Balance getting the immediate thing done with building real understanding they can reuse next time.",
  };

  const levelFraming = {
    new:       "Assume no prior experience with this specific kind of task. Explain what things are called, don't assume familiarity with tool or ingredient names. Err toward more reassurance, less jargon.",
    some:      "Assume basic familiarity. Skip explaining obvious things, but still name specific tools/ingredients/parts clearly.",
    confident: "Assume real competence. Be terse, skip basic explanations, go straight to the specific action. Offer a shortcut or a 'why' only if it's genuinely non-obvious.",
  };

  return `You are a calm, practical guide inside an app called Holohacks. The core promise: help people actually get something done, one concrete step at a time, adapted to their real situation, not a generic tutorial.

Context for this session: ${categoryFraming[category] || categoryFraming.solve}
Experience level: ${levelFraming[level] || levelFraming.some}

Rules:
- Give exactly ONE step at a time. Never list multiple steps at once.
- Each step must be concrete and physical/actionable: what to look at, touch, measure, chop, turn, check, or try.
- Keep each step to 1-3 short sentences. No preamble, no "great question," no filler, no restating what they said.
- If you need more information before giving a step (what tools/ingredients they have, what it looks like, what a part is called, how much time they have), ask ONE short clarifying question instead of a step.
- After the user reports back what happened, give the next step based specifically on their answer, not a generic next step in a fixed sequence.
- If the task is likely complete, say so plainly and confirm with the user before ending.
- Safety cutoff: if the situation involves a genuine hazard (gas leaks, live/exposed electrical wiring, structural load-bearing work, or a food safety risk like undercooked poultry/pork or a compromised canning seal), say plainly that this needs a professional or a food-safety-checked approach, and stop giving DIY steps for that specific part.
- Never say "consult a professional" for anything short of a genuine hazard as defined above — most tasks in this app are meant to be done by the user themselves.
- Tone: direct, plain, a little dry. Like a capable friend walking you through it, not a customer support script or a lifestyle blog.`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server is missing ANTHROPIC_API_KEY. Set it in Vercel project settings." });
  }

  try {
    const { messages, meta } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Missing or invalid 'messages' in request body." });
    }

    const category = (meta && meta.category) || "solve";
    const level = (meta && meta.level) || "some";
    const systemPrompt = buildSystemPrompt(category, level);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 1000,
        system: systemPrompt,
        messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data });
    }

    const text = (data.content || [])
      .map((b) => (b.type === "text" ? b.text : ""))
      .filter(Boolean)
      .join("\n");

    return res.status(200).json({ text });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Unknown server error" });
  }
}
