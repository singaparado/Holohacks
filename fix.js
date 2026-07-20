// Vercel serverless function.
// Lives at /api/fix — the frontend calls this instead of Anthropic directly,
// so the API key never sits in code the browser can see.

const SYSTEM_PROMPT = `You are a calm, practical repair guide inside an app called Holohacks. A user is trying to fix something themselves (appliances, furniture, household fixes, basic electronics, etc).

Rules:
- Give exactly ONE step at a time. Never list multiple steps at once.
- Each step must be concrete and physical: what to look at, what to touch, what to turn, what to check.
- Keep each step to 1-3 short sentences. No preamble, no "great question," no filler.
- If you need more information before giving a step (what model, what it looks like, what sound it makes), ask ONE short clarifying question instead of a step.
- After the user reports back what happened, give the next step based on their answer.
- If the fix is likely complete, say so plainly and confirm with the user before ending.
- Never say "consult a professional" unless the issue is a genuine safety hazard (gas, live electrical wiring, structural). If so, say that plainly and stop.
- Tone: direct, plain, a little dry. Like a good handyman neighbor, not a customer support script.`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server is missing ANTHROPIC_API_KEY. Set it in Vercel project settings." });
  }

  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Missing or invalid 'messages' in request body." });
    }

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
        system: SYSTEM_PROMPT,
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
