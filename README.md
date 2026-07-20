# Holohacks — Deploy Instructions

What's in this folder:

- `index.html` — the whole app, one file, CSS and JS inlined (same pattern as your other sites, no relative-path 404 risk)
- `api/fix.js` — the one piece of backend. Holds your Anthropic API key server-side and talks to Claude. Without this, the frontend has nowhere safe to put the key.
- `manifest.json` + `sw.js` + `icon-192.png` + `icon-512.png` — what makes this installable to a home screen on iPhone and Android, not just openable in a browser

## Step 1 — Get an Anthropic API key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an API key
3. Keep it somewhere private for a moment — you'll paste it into Vercel, never into any file that goes to GitHub

## Step 2 — Push this folder to GitHub

Same as your other projects:

1. Create a new repo (e.g. `holohacks-app`)
2. Upload all the files in this folder, keeping the `api/` folder structure intact (the `fix.js` file must stay inside a folder literally named `api`, Vercel uses that to know it's a backend function)

## Step 3 — Deploy on Vercel

1. Import the repo into Vercel, same as before
2. Before the first deploy finishes, go to the project's **Settings → Environment Variables**
3. Add one: name it `ANTHROPIC_API_KEY`, paste your key as the value
4. Redeploy (Vercel usually prompts you to, or push any small change to trigger it)

## Step 4 — Test it

1. Open the live Vercel URL on your phone
2. Try describing a fake problem, confirm you get one step back, not a wall of text
3. If it fails, check Vercel's **Deployments → Functions logs** — the most common issue is the env var name being slightly off, or the `api` folder not being named exactly `api`

## Step 5 — Install to home screen (this is your "app" without an app store)

- **iPhone:** open the URL in Safari (must be Safari, not Chrome) → tap Share → "Add to Home Screen"
- **Android:** open in Chrome → it will usually prompt "Install app" on its own, or tap the three-dot menu → "Install app"

Once installed, it opens full-screen with its own icon, no browser bar. That's the app.

## What's NOT done yet, in order of what matters most for MRR

1. **The paywall button doesn't charge anyone yet.** It's a locked screen with no Stripe behind it. This is the next real step before you can call this "generating revenue."
2. **No user accounts.** Right now "3 free fixes" resets every time someone reloads the page. Fine for a first test, not fine once you're charging.
3. **No image compression.** Large photos will work but will be slow and use more API cost than needed. Fine for now.

## What IS done

The actual product loop — describe or photograph a problem, get one real step at a time, paywall after 3 — is real and working end to end once your API key is in place. That's the thing worth testing with actual people before spending more time on billing or accounts.
