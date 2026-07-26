// Vercel serverless function — /api/verify-payment
// Called when someone returns from a Stripe Payment Link with a
// ?session_id=... in the URL. Verifies the session server-side with
// Stripe's own secret key, so nobody can fake this by editing the URL.

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return res.status(500).json({ error: "Server is missing STRIPE_SECRET_KEY." });
  }

  const sessionId = req.query.session_id;
  if (!sessionId) {
    return res.status(400).json({ error: "Missing session_id." });
  }

  try {
    const response = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
      { headers: { Authorization: `Bearer ${secretKey}` } }
    );
    const session = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: session });
    }

    // payment_status is "paid" for one-time payments and the first invoice of
    // a subscription. For ongoing subscription validity beyond this moment,
    // Stripe's own dashboard is the source of truth — this endpoint only
    // confirms "did this specific checkout succeed."
    const paid = session.payment_status === "paid" || session.status === "complete";
    return res.status(200).json({ paid });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Unknown server error" });
  }
}
