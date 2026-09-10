
# CMS-GruppTidning

Content-driven news site built with Next.js and Storyblok as headless CMS.

## Setup

```sh
npm install
```

Create a `.env` file in the project root:

```sh
STORYBLOK_DELIVERY_API_TOKEN=<your token>
```

Copy the preview access token from Storyblok under **Settings > Access Tokens**.

```sh
npm run dev
```

## Deploy (Vercel) + Storyblok webhook

1. Import this repo into Vercel.
2. Set env vars in the Vercel project: `STORYBLOK_DELIVERY_API_TOKEN`,
   `STORYBLOK_REGION`, `SITE_URL` (your Vercel prod URL).
   **Important:** for the production `STORYBLOK_DELIVERY_API_TOKEN`, use the
   space's **Public** token, NOT the Preview token from your local `.env`.
   Find or create it in Storyblok under Settings → Access Tokens. The
   Preview token can read draft/unpublished content — the app only requests
   drafts in local development (see `SB_VERSION` in `src/lib/storyblok.js`),
   but the token itself is still exposed to the browser bundle for live
   preview, so production must use a token that can only read published
   stories. The Management API token can't create this token for you
   (its `/api_keys` endpoint 403s for Personal Access Tokens) — it must be
   created manually in the Storyblok UI.
3. Deploy. In Project Settings → Git → Deploy Hooks, create a hook and
   copy its URL.
4. In Storyblok: Settings → Webhooks → add the Deploy Hook URL, trigger on
   "Story published" and "Story unpublished".
5. In Storyblok: Settings → Visual Editor → set Location to the Vercel
   prod URL.
