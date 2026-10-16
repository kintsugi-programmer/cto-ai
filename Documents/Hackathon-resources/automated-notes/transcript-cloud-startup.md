# FalkorDB Cloud — Startup tier walkthrough

> **Source:** [`Transcript copy 9.txt`](../Transcript%20copy%209.txt) · **Type:** webinar transcript · **Saved:** Oct 16, 2026 · **Original URL:** https://www.youtube.com/watch?v=xjpLPoQgo2s

## Overview

- Short screen-recording walkthrough of spinning up a **FalkorDB Cloud** instance on the **Startup tier** and exploring it in the Browser — a demo/onboarding video with no speaker intro, code, or Q&A.
- Flow shown: sign in → **Create** → subscribe to Startup by selecting it → configure provider, region, memory, name, description, credentials → instance details (ID + endpoint) → Connect → Browser → instance management.
- Key contrast with the free tier: **Startup lets you toggle TLS on/off, tune persistence, and control a variety of other parameters** to suit your use case.
- Closing pitch aimed at the hackathon audience: **multi-tenancy** — "normally reserved for enterprises in competing graph databases" — "is readily available to you even in the free tier".
- Named use-case spaces: **cyber security, agentic AI, and identity management**, where the database handles "tough multihop queries with ease and at jaw-dropping speeds".

## Setup flow

### 1. Sign in

- First, start by logging into your FalkorDB Cloud account.

### 2. Create and pick the tier

- Once inside, click the **Create** button to spin up a new FalkorDB instance.
- Subscribe to the **Startup tier by selecting it** — "and that's it. You're ready to configure your instance."

### 3. Configure the instance

- A **variety of parameters** can be customized. For example:
  - **Cloud provider** — which provider you'd like to use.
  - **Region** — where you'd like to deploy your instance.
- The same panel lets you control different facets of the instance and tailor it to your exact needs:
  - **Amount of memory** to assign.
  - **Name** for the instance.
  - **Description** for the instance.
  - **Primary user** and his **associated credentials**.
- **Startup-tier specifics (vs the free tier):**
  - Toggle **TLS on and off**.
  - **Tune the persistence.**
  - Control a variety of parameters that suit your use case.
- When done, hit **Create** to spin up the instance.

### 4. Open the instance

- Click on the **instance's name** to appear inside it.
- Important information found here: the **instance ID** and the **database's endpoint**.
- Save both for later, then you're ready to connect and visualize your data.

## Browser walkthrough

- Once the instance is live, hit the **Connect** button, which brings up FalkorDB's graph visualization tool called **Browser**.
- The **endpoint, port, and username are already pre-filled**; all you have to do is **enter your password**.
- The **default query the browser ran** visualizes the data that's currently available.
- **Zoom in on a node and right-click it** — brings up the **editable attributes panel**, which allows you to **consult or modify individual nodes at any time**.
- **Smart filter (graph info panel, left):** clicking on a specific **node or edge** inside the graph info panel acts as a smart filter — it lets you filter graph data points **from the point of view of the specific edge type** (e.g., filtering by **route** "would simply display the possible ways to travel from one airport to the other by understanding how the two are connected").
- **Query history window:** you can also view the **query performance** for past queries in it.

## Instance management (Cloud control panel)

- Complete control and a comprehensive overview of your instance includes:
  - A **report on the nodes**.
  - **Metrics**.
  - **Audit logs**.
  - **Importing or exporting your RDB**.
- **Actions button (right side)** — quickly **stop, modify, or reboot** the instance.
- The **instance details panel** was created to present all crucial information **in a single location**, so instance management "doesn't hinder your progress, but facilitates it".

## Key facts and numbers

- Tier flow: log in → Create → **select Startup tier** → configure → Create.
- Configurable parameters: cloud provider, region, **amount of memory**, name, description, primary user + credentials.
- Startup-only (vs free) options: **TLS toggle on/off**, **persistence tuning**, "a variety of parameters" for your use case.
- Instance details expose the **instance ID** and **database endpoint** — save both.
- Browser entry: **Connect** button; **endpoint, port, and username pre-filled**, password entered manually.
- Default Browser query visualizes currently available data.
- Smart filter: click a node or edge in the **graph info panel on the left** to filter by edge type; example — **route** edges show possible ways to travel between two airports by how they're connected.
- Query performance is reviewable in the **query history window**.
- Instance overview covers **nodes report, metrics, audit logs, RDB import/export**.
- Admin actions via the **Actions button on the right**: stop, modify, reboot.
- **Multi-tenancy is available even on the free tier** (otherwise an enterprise-class feature in competing graph databases).
- Claimed strengths: tough **multihop queries** with ease and **jaw-dropping speeds**.
- Use-case spaces named: **cyber security, agentic AI, identity management**.
- Closing offer: "If you've got any questions, we're right here to help."

## Hackathon relevance

- The Startup tier is the cheapest upgrade that unblocks production-ish hardening: **TLS on/off** for secured `falkors://`/`rediss://` connections and tunable **persistence** so an agent-memory graph survives restarts.
- Sizing **memory** at create time matters for hackathon demos that bulk-load a company-brain graph (e.g., GraphRAG ingestion) without hitting limits.
- Saving the **instance ID and endpoint** up front speeds up wiring the agent backend and avoids re-finding connection details mid-demo.
- The **smart filter by edge type** (route example) is a quick way to show judges how connectivity drives answers in the connected-data track.
- **Query history** performance numbers help you tune agent-generated Cypher and prove multihop query speed on stage.
- **RDB import/export** lets you snapshot the agent's graph for backup or handoff between teammates.

## Related notes

- [transcript-cloud-free.md](transcript-cloud-free.md) — the default tier and its walkthrough; Startup adds TLS, persistence, and memory controls.
- [transcript-cloud-pro.md](transcript-cloud-pro.md) — Pro tier adds replication vs cluster, single/multi-zone, and up to two replicas.
- [transcript-cloud-enterprise.md](transcript-cloud-enterprise.md) — Enterprise tier adds public/private networking, Prometheus metrics, and audit-log tooling.
- [docs-home.md](docs-home.md) — documentation home that advertises the free cloud instance ("Try FalkorDB Cloud").
- [../../guide/03-run-falkordb.md](../../guide/03-run-falkordb.md) — guide module comparing Docker vs Cloud and the Free/Startup/Pro/Enterprise tiers.
