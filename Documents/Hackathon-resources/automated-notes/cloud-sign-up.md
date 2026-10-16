# FalkorDB Cloud — Sign-up page

> **Source:** [`Sign up.mhtml`](../Sign%20up.mhtml) · **Type:** cloud app page · **Saved:** Oct 16, 2026 · **Original URL:** https://app.falkordb.cloud/signup

## Overview

- The account-creation screen of **FalkorDB Cloud** (`app.falkordb.cloud`), the hosted service for running FalkorDB instances.
- Sign-up is **email-first and minimal**: the page shows a single required **Email** field and a **Next** button; no password field appears in the saved copy.
- Heading is the call to action **"Get Started Today"**; the saved footer confirms the app's legal links and the standard cookie notice.
- Appears in the cloud app's own flow (previous step in the login shell links here as "Sign up"); the sign-up page links back to sign-in for existing users.

## What the page contains (as saved)

- Tab/title: **Sign up**.
- Heading: **"Get Started Today"**.
- Form fields and controls:
  - `Email *` — required email field.
  - **Next** button (submits the email; the verification/onboarding step that follows is not part of the saved page).
- Existing-user link: **"Already have an account? Login here"** → `https://app.falkordb.cloud/signin`.
- Footer: "© 2026 FalkorDB All rights reserved." with **Terms & Conditions** → `https://app.falkordb.cloud/terms-of-use`, **Privacy Policy** → `https://app.falkordb.cloud/privacy-policy`, and **Cookie Settings**.

## Cookie notice (as shown)

> We care about your privacy

- "We use necessary cookies to keep the FalkorDB platform secure and reliable. Optional analytics cookies help us improve the platform experience. Accept All enables analytics cookies. Reject All uses only necessary cookies. Learn more in our Cookie Policy." → Cookie Policy: `https://app.falkordb.cloud/cookie-policy`
- Buttons: **Reject All** / **Accept All**.

## What this page is for

- Creates a FalkorDB Cloud account: enter your email, continue ("Next") through the onboarding flow, and you land in the cloud app where free and paid instances are managed (post-login destination in the login flow is `/instances`).
- The sign-in page points new users here ("New to FalkorDB? Sign up"); this page points existing users back to sign-in.
- Recommended hackathon path for getting a hosted FalkorDB instance quickly, versus running the Docker image locally.

## Key facts and numbers

- URL: `https://app.falkordb.cloud/signup`.
- Page heading: **"Get Started Today"**; only field: **Email ***; button: **Next** (no "Remember Me" checkbox here, unlike sign-in).
- Sign-in link: `https://app.falkordb.cloud/signin` · Terms: `/terms-of-use` · Privacy: `/privacy-policy` · Cookie policy: `/cookie-policy`.
- Footer: **© 2026 FalkorDB** (All rights reserved) · Terms & Conditions · Privacy Policy · Cookie Settings.
- Cookie choices: **Reject All** (necessary cookies only) / **Accept All** (enables analytics cookies) — necessary cookies keep the platform secure and reliable.

## Hackathon relevance

- Fastest way to stand up FalkorDB for a hackathon project without Docker: create an account here, continue to `/instances`, and launch a free instance.
- Judging expects a live deployment (preferred) — a FalkorDB Cloud instance makes that deployment story simple, with the agent connecting to the hosted graph.
- Once registered, logins go through [cloud-sign-in.md](cloud-sign-in.md); quirk of the saved shell: both screens are email-only first steps.

## Related notes

- [cloud-sign-in.md](cloud-sign-in.md) — the login counterpart for existing accounts.
- [docs-home.md](docs-home.md) — documentation entry point, including cloud and Docker getting-started paths.
- [transcript-cloud-free.md](transcript-cloud-free.md) — what the free FalkorDB Cloud plan includes.
