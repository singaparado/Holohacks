# Holohacks — Master Deploy Guide

This is the one README to actually use. It replaces every earlier version, everything below reflects the current, real state of the project, not a changelog of how it got here.

---

## What Holohacks Is

Describe a task (a repair, a recipe question, an assembly problem, a daily annoyance, or wanting to learn a skill), or attach a photo. Get one clear, concrete step, adapted to your actual tools, ingredients, and experience level. Say what happened. Get the next step. Not a wall of instructions up front, a real back-and-forth.

---

## Site Structure

Two layers, same idea as Ploy's site or Anthropic's (anthropic.com explains it, claude.ai is the tool):

```
/index.html              <- marketing homepage. Explains the product. Does not call the AI.
/sw.js                   <- service worker, covers both pages, enables "Add to Home Screen"
/icon-192.png
/icon-512.png
/app/
  index.html               <- the actual tool: task intake, step-by-step guidance, paywall
  manifest.json            <- PWA manifest, installs THIS page to the home screen
/api/
  fix.js                    <- serverless function, holds your Anthropic key, talks to Claude
  verify-payment.js         <- serverless function, confirms a Stripe payment actually happened
```

**Homepage (`/`):** headline, how it works, what it covers, why it's not just "ask a chatbot," pricing. Every "Try it free" button links to `/app/`.

**The tool (`/app/`):** the working product. Five task-type chips (Fix, Cook, Build/assemble, Daily hack, Learn a skill) and an experience-level picker (New to this / Some experience / Confident), both optional, both sharpen the guidance when set. The backend prompt adapts on both axes, a cooking session treats your actual ingredients as fixed constraints, a "confident" user gets terse steps, a "new to this" user gets more scaffolding.

**Safety cutoff, built in on purpose:** for genuine hazards (gas, live electrical wiring, structural work, undercooked poultry/pork, a compromised canning seal), the app says plainly that this needs a professional or a checked approach and stops giving DIY steps for that specific part. This isn't optional politeness, it's the one thing the app should never gloss over.

---

## Deploying From Scratch

### Step 1 — Get an Anthropic API key
Go to [console.anthropic.com](https://console.anthropic.com), create a key, keep it private. You'll paste it into Vercel, never into any file that goes to GitHub.

### Step 2 — Push everything to GitHub
Create a repo (e.g. `holohacks-app`), upload the full folder structure above exactly as shown. The `api/` folder must be named exactly `api`, that's how Vercel knows those are backend functions rather than pages.

### Step 3 — Deploy on Vercel
Import the repo. Before or right after the first deploy, go to **Settings → Environment Variables** and add:
- `ANTHROPIC_API_KEY` — your key from Step 1
- `STRIPE_SECRET_KEY` — see the Stripe section below (can be added later, once you get there)

Redeploy after adding variables (push any small change, or use Vercel's redeploy button).

### Step 4 — Test it
Open the live URL. Confirm the homepage loads at `/`, and tapping "Try it free" lands you in the actual tool at `/app/`. Try all five task types once each (a repair, a recipe, an assembly problem, a daily annoyance, a "teach me X"), and confirm the tone actually shifts between "new to this" and "confident" on the same task. If a request fails, check Vercel's **Deployments → Functions logs**, the most common issue is an environment variable name being slightly off.

### Step 5 — Install to home screen
This is what makes it feel like "an app" without an app store:
- **iPhone:** open `/app/` specifically in Safari (must be Safari, not Chrome) → Share → "Add to Home Screen"
- **Android:** open `/app/` in Chrome → it usually prompts "Install app" on its own, or use the three-dot menu

It has to be done from `/app/`, not the homepage, because that's where the manifest lives.

---

## Setting Up Stripe (so the paywall actually charges someone)

1. **Sign up at stripe.com in Safari.** It's a website, not an app to install.
2. **Create a Product:** Products → Add product. Name it "Holohacks Unlimited," recurring, $6.99/month (or whatever you land on).
3. **Create a Payment Link** for that product. Stripe gives you a real checkout URL (`https://buy.stripe.com/xxxxx`). Stripe hosts the card entry, you never touch or store card details yourself.
4. **Set the after-payment redirect** in the Payment Link's settings, under "After payment" → "Redirect customers to your website":
   ```
   https://your-deployed-site.vercel.app/app/?session_id={CHECKOUT_SESSION_ID}
   ```
   Note this points to `/app/`, not the root, because that's where the payment-verification check actually runs.
5. **Paste the Payment Link** into `/app/index.html`, replacing the placeholder text `STRIPE_PAYMENT_LINK_GOES_HERE` (it's the "Unlock unlimited" button on the paywall screen).
6. **Add `STRIPE_SECRET_KEY` to Vercel:** in Stripe, Developers → API keys, copy the **secret** key (not the publishable one). Add it in Vercel the same way you added `ANTHROPIC_API_KEY`.
7. **Redeploy, then test the whole loop yourself:** use up your 3 free tasks, hit the paywall, tap "Unlock unlimited," pay with a real card (or Stripe's test card `4242 4242 4242 4242` while testing), confirm you land back in `/app/` with "Unlimited — unlocked" in the header.

### How you'll know someone is actually paying
No separate analytics tool needed. Log into stripe.com in Safari, the Dashboard shows your MRR directly, plus a Customers tab and a Subscriptions tab (active vs. canceled). That's your real-time source of truth.

### The honest limitation of this payment flow
It confirms "did this browser just complete a real checkout," which stops people from faking the URL to unlock free. It does not, right now, re-check weeks later whether a subscription is still active, that would need a small database, worth building once you have real subscribers to justify it, not before. If someone cancels, you'd see it in Stripe, but the app wouldn't automatically re-lock their specific device yet.

---

## What's Actually Done vs. Still Open

**Done and working end to end, once your keys are in place:**
- The full task loop (describe/photograph → one step at a time → adapts to your reply)
- Free-fix count that persists across visits (localStorage, not reset on reload)
- Real Stripe payment verification unlocking unlimited use
- Installable to home screen on iPhone and Android
- Two-layer site (marketing homepage + tool)

**Still open, roughly in order of what matters next:**
1. Subscription cancellations don't automatically re-lock a device (needs a small database, see above)
2. No image compression, large photos work but are slower and cost more API usage than needed
3. No accounts, so switching phones or clearing browser data resets someone's free-fix count and unlock status

---

## Marketing This, Concretely

Post a real screen recording of a real task solved start to finish (a fix, a recipe, an assembly) in places where people already discuss that exact problem: relevant subreddits (r/HomeImprovement, r/Cooking, r/DIY depending on the clip), local Facebook groups, TikTok. One specific, honest demonstration beats a general "check out my app" post. A direct side-by-side against asking a general AI chatbot (wall of steps vs. one step that adapts) is also honest marketing, because it's the real differentiator. Once you have a few clips, point them at the homepage above rather than a bare `/app/` link, that's what it's there for.
