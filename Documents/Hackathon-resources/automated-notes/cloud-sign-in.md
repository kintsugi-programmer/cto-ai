# FalkorDB Cloud — Sign-in page

> **Source:** [`Sign In.mhtml`](../Sign%20In.mhtml) · **Type:** cloud app page · **Saved:** Oct 16, 2026 · **Original URL:** https://app.falkordb.cloud/signin?destination=%2Finstances

## Overview

- The sign-in screen of **FalkorDB Cloud** (`app.falkordb.cloud`), the hosted service for running FalkorDB instances. It is the login step users hit before reaching the app's instance list.
- The saved URL carries `destination=%2Finstances`, i.e. after a successful login the app routes the user to `/instances` — the page that manages the account's FalkorDB instances.
- Login is **email-first**: the page shows a single required **Email** field and a **Next** button; no password field appears in the saved copy.
- The saved snapshot was captured with the form freshly loaded/validated — the "Email is required" message is visible.
- This page is reached from the marketing site's "Log in" link and is paired with a separate sign-up screen.

## What the page contains (as saved)

- Tab/title: **Sign In**.
- Heading: **"Enter your email to log in"**.
- Form fields and controls:
  - `Email *` — required email field.
  - Validation message: **"Email is required"**.
  - **Remember Me** checkbox.
  - **Next** button (submits the email; the step that follows — password or verification — is not part of the saved page).
- Alternative path link: **"New to FalkorDB? Sign up"** → `https://app.falkordb.cloud/signup`.
- Footer: "© 2026 FalkorDB All rights reserved." with **Terms & Conditions** → `https://app.falkordb.cloud/terms-of-use`, **Privacy Policy** → `https://app.falkordb.cloud/privacy-policy`, and **Cookie Settings**.

## Cookie notice (as shown)

> We care about your privacy

- "We use necessary cookies to keep the FalkorDB platform secure and reliable. Optional analytics cookies help us improve the platform experience. Accept All enables analytics cookies. Reject All uses only necessary cookies. Learn more in our Cookie Policy." → Cookie Policy: `https://app.falkordb.cloud/cookie-policy`
- Buttons: **Reject All** / **Accept All**.

## What this page is for

- Authentication entry point for FalkorDB Cloud: enter your email, then continue ("Next") to log in and manage your instances at `/instances`.
- Provides the alternate route to account creation via the "Sign up" link, and the legal/cookie controls required by the hosted platform.
- During the hackathon it is the way back into a free or paid cloud instance created through the sign-up flow.

## Key facts and numbers

- URL: `https://app.falkordb.cloud/signin?destination=%2Finstances` (destination after login: **/instances**).
- Page heading: **"Enter your email to log in"**; only field: **Email ***; validation: **"Email is required"**; checkbox: **Remember Me**; button: **Next**.
- Footer: **© 2026 FalkorDB** (All rights reserved) · Terms & Conditions · Privacy Policy · Cookie Settings.
- Sign-up link: `https://app.falkordb.cloud/signup` · Terms: `/terms-of-use` · Privacy: `/privacy-policy` · Cookie policy: `/cookie-policy`.
- Cookie choices: **Reject All** (necessary cookies only) / **Accept All** (enables analytics cookies) — necessary cookies keep the platform secure and reliable.

## Hackathon relevance

- FalkorDB Cloud gives hackathon teams a hosted instance without local setup — this sign-in page is the front door once an account exists.
- The `destination=%2Finstances` parameter shows the post-login workflow: log in → pick/manage an instance → point the agent at it.
- New teams start at [cloud-sign-up.md](cloud-sign-up.md); the free plan is described in the cloud-pricing webinar notes.

## Related notes

- [cloud-sign-up.md](cloud-sign-up.md) — the account-creation counterpart to this login screen.
- [docs-home.md](docs-home.md) — documentation entry point, including cloud and Docker getting-started paths.
- [transcript-cloud-free.md](transcript-cloud-free.md) — details of the free FalkorDB Cloud plan this login leads to.
