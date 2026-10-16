# FalkorDB Cloud — Free tier walkthrough

> **Source:** [`Transcript copy 10.txt`](../Transcript%20copy%2010.txt) · **Type:** webinar transcript · **Saved:** Oct 16, 2026 · **Original URL:** https://www.youtube.com/watch?v=z0XO4pb2t5Y

## Overview

- Short screen-recording walkthrough of spinning up a **FalkorDB Cloud** instance on the **free tier** and exploring it in the Browser — a demo/onboarding video with no speaker intro, code, or Q&A.
- Shows the full happy path: sign in (or sign up) → **Create** → tune subscription/provider/region → set name, primary user, password → instance overview → Connectivity tab → Browser → admin actions.
- The **free tier is the default subscription** after creating an account; "upgrading to another tier when you're ready is quite simple".
- Closing pitch aimed at the hackathon audience: **multi-tenancy** — a feature "normally reserved for enterprises in competing graph databases" — "is readily available to you even in the free tier".
- Named use-case spaces: **cyber security, agentic AI, and identity management**, where the database handles "tough multihop queries with ease and at jaw-dropping speeds".

## Setup flow

### 1. Sign in (or sign up)

- Start by logging into your FalkorDB Cloud account.
- No account yet: sign one up by clicking the **sign up** button below.

### 2. Create an instance

- Now that you're in, click the **Create** button to spin up a new FalkorDB instance.
- You're subscribed to the **free tier by default**.
- On this screen you can tune the instance to your project:
  - **Kind of subscription** — which tier you want.
  - **Cloud provider** — the provider you'd like to use.
  - **Region** — where you'd like to store your project.

### 3. Configure the deployment

- Use the configuration panel to set different aspects of your deployment:
  - **Name** of the deployment.
  - **Primary user**.
  - **Password**.
- The **summary of your deployment is displayed on the right** while you configure.

### 4. Launch and open the instance

- Once the instance is **live and running**, click on its **name** to appear inside it for a more detailed overview.
- The **instance endpoint** lives inside the **Connectivity tab** — copy it for easy access later.

## Instance management (Cloud control panel)

- **Audit logs** — view your instance's audit logs back in the cloud control panel.
- **Redis data backup terms** [unclear] — also visible in the control panel "if those apply in your case".
- **Actions button (right side)** — stopping, modifying, or rebooting the instance "can be easily done" from here.

## Browser walkthrough

- Click the **Connect** button to enter the **FalkorDB Browser**, where you **visualize, interact with, and modify** your graph data.
- The **username and password configured during instance creation are already pre-populated**.
- The **default query the browser ran at launch** displays the **labels and relationships currently on record**.
- **Smart filter (left side)** — lets you toggle different aspects of the graph on and off.
- **Zoom in on a node and right-click it** — brings up that node's **editable attributes panel**, which allows you to **view or modify** its attributes "at any point in time".

## Key facts and numbers

- Default subscription on account creation: **Free tier**; upgrading to another tier later is "quite simple".
- Choose at create time: subscription kind, cloud provider, region — then deployment name, primary user, password.
- Deployment **summary sits on the right** of the create screen.
- Endpoint location: **Connectivity tab** (copy it for later).
- Browser entry: the **Connect** button; username + password pre-filled from instance creation.
- Default Browser query shows **labels and relationships currently on record**.
- **Smart filter on the left** toggles graph aspects on/off; node attributes panel opens via **zoom in + right-click**, editable at any time.
- Admin actions via the **Actions button on the right**: stop, modify, reboot.
- **Multi-tenancy is available even on the free tier** (otherwise an enterprise-class feature in competing graph databases).
- Claimed strengths: tough **multihop queries** with ease and **jaw-dropping speeds**.
- Use-case spaces named: **cyber security, agentic AI, identity management**.
- Closing offer: "If you've got any questions, we're right here to help."

## Hackathon relevance

- Zero-cost route to the "live deployment" judging preference: stand up a managed FalkorDB instance in minutes, copy the endpoint from the Connectivity tab, and point the agent's client library at it — no Docker required.
- **Multi-tenancy on the free tier** means one instance can host separate graphs per track or per agent (e.g., company brain vs agent memory) at no cost.
- The Browser's smart filter and editable node attributes panel give a live, visual way to debug and demo what the agent is writing into the graph (connected-data track).
- Audit logs plus stop/modify/reboot actions let you keep the instance tidy and cost-free between build sessions.
- The Connectivity-tab endpoint is exactly what the Python/JS clients and integration tooling connect to for agent memory and coordination.

## Related notes

- [transcript-cloud-startup.md](transcript-cloud-startup.md) — the next tier up: TLS toggle, persistence tuning, and memory sizing.
- [transcript-cloud-pro.md](transcript-cloud-pro.md) — Pro tier adds replication vs cluster choices, single/multi-zone, and up to two replicas.
- [transcript-cloud-enterprise.md](transcript-cloud-enterprise.md) — Enterprise tier adds private networking, a Prometheus metrics endpoint, and audit-log tooling.
- [docs-home.md](docs-home.md) — documentation home that advertises the free cloud instance ("Try FalkorDB Cloud").
- [../../guide/03-run-falkordb.md](../../guide/03-run-falkordb.md) — guide module comparing Docker vs Cloud and the Free/Startup/Pro/Enterprise tiers.
