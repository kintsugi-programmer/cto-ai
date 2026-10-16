# FalkorDB Cloud — Pro tier walkthrough

> **Source:** [`Transcript copy 8.txt`](../Transcript%20copy%208.txt) · **Type:** webinar transcript · **Saved:** Oct 16, 2026 · **Original URL:** https://www.youtube.com/watch?v=UIzrW9otvYM

## Overview

- Short screen-recording walkthrough of spinning up a **FalkorDB Cloud** instance on the **Pro plan** and exploring it in the Browser — a demo/onboarding video with no speaker intro, code, or Q&A.
- Flow shown: log in (signing up is free) → **Create** → subscribe to Pro → **set up payment** → choose replication vs cluster, single-zone vs multi-zone, replicas, node types, credentials, advanced configs → Create → instance admin panel → Connect → Browser.
- Pro's differentiator vs other plans: **greater customization capabilities** — replication or cluster deployments, each of which can be **single zone or multi-zone**; multi-zone spreads a replication deployment across **at least two zones**.
- Replica limit: the number of replicas is configurable for single-zone and multi-zone deployments, and **currently two replicas are supported**.
- Closing pitch aimed at the hackathon audience: **multi-tenancy** — "normally reserved for enterprises in competing graph databases" — "is readily available to you even in the free tier".
- Named use-case spaces: **cyber security, agentic AI, and identity management**, where the database handles "tough multihop queries with ease and at jaw-dropping speeds".

## Setup flow

### 1. Sign in

- First, start by logging into your FalkorDB Cloud account; if you don't already have one, **signing up is free**.

### 2. Create and subscribe to Pro

- Once you're inside, click the **Create** button in order to set up your new instance.
- Inside, **subscribe to the Pro plan from the list** to get started.
- **Ensure that you set up payment before proceeding** (required for this plan).

### 3. Configure the deployment

- Pro offers greater customization than other plans, starting with the **deployment type**:
  - Choose between **replication** and **cluster** deployments.
  - Each of these can be either **single zone** or **multi-zone**.
  - Selecting **multi-zone** will deploy a replication deployment across **at least two zones**.
- Deployment parameters are configured **based on deployment type**:
  - For **single-zone and multi-zone** deployments: set the **number of replicas** — **currently, two replicas are supported**.
- Also configurable from this panel:
  - **Node types**.
  - **Instance credentials** — including **name**, **description**, and **primary user**.
- **Advanced configurations** available for the instance:
  - **Persistence**.
  - **Cache size**.
- The **deployment summary** is displayed on the **right-hand side menu**.
- Once ready, click **Create** to spin up the newly configured instance.

### 4. After launch

- This is your **instance admin panel**; the new instance should be **healthy and running within a couple of minutes**.
- **Give the dashboard a quick refresh**, then **click the instance name** to appear inside it.

## Browser walkthrough

- With the instance running, click the **Connect** button to visualize your data using **FalkorDB's Browser**, a graph visualization tool.
- Your **endpoint, port, and username are pre-filled**; **enter your password** and log in to view your graph.
- The **query that the browser ran at launch** displays the data currently making up your graph.
- The **toggles on the left** allow you to **show or hide different aspects** of the graph.
- The **filters inside the graph info panel** make filtering different **edges** in the graph much simpler, depending on the analysis you're performing.
- To dive deeper, **zoom in on individual nodes** for a more granular view.

## Instance management (Cloud control panel)

- Complete control and a comprehensive overview of your instance includes:
  - A **report on the nodes**.
  - **Metrics**.
  - **Audit logs**.
- The **instance details panel** presents all crucial information **in a single location**, ensuring that instance management "doesn't hinder your progress, but facilitates it".

## Key facts and numbers

- Pro plan requirements: **set up payment before proceeding**.
- Deployment types: **replication** or **cluster**; each **single zone** or **multi-zone**.
- **Multi-zone** = replication deployment across **at least two zones**.
- Replicas: configurable number for single-zone and multi-zone deployments; **two replicas currently supported**.
- Other create-time options: **node types**; **name, description, primary user** (instance credentials); advanced **persistence** and **cache size**.
- **Deployment summary** on the **right-hand side menu**.
- Post-create: instance should be **healthy and running within a couple of minutes**; **refresh the dashboard**, then click the instance name.
- Browser entry: **Connect** button; **endpoint, port, username pre-filled**, password entered manually.
- Browser UI: default launch query shows the graph; **toggles on the left** show/hide aspects; **graph info panel filters** simplify per-edge filtering; **zoom** gives a granular node view.
- Instance overview covers **nodes report, metrics, audit logs**.
- **Multi-tenancy is available even on the free tier** (otherwise an enterprise-class feature in competing graph databases).
- Claimed strengths: tough **multihop queries** with ease and **jaw-dropping speeds**.
- Use-case spaces named: **cyber security, agentic AI, identity management**.
- Closing offer: "If you've got any questions, we're right here to help."

## Hackathon relevance

- **Multi-zone replication** is the strongest reliability story available without Enterprise: put the agent's memory graph in at least two zones and demo resilience if a zone wobbles.
- **Two replicas** plus configurable **cache size** and **persistence** give headroom for heavier agent workloads — e.g., concurrent GraphRAG ingestion and retrieval during judging.
- Choosing **replication vs cluster** at create time is a one-click way to match the deployment topology to the hackathon's "scalable context layer" pitch.
- Payment must be set up before Pro — worth doing early in the hackathon so an upgrade doesn't block a deadline.
- The Browser's left-side toggles and graph-info-panel edge filters make it easy to narrate a demo of a connected-data graph; the instance details panel keeps nodes/metrics/audit logs one click away.

## Related notes

- [transcript-cloud-free.md](transcript-cloud-free.md) — the default tier walkthrough; Pro layers replication/cluster choices on top.
- [transcript-cloud-startup.md](transcript-cloud-startup.md) — Startup tier with TLS toggle, persistence tuning, and memory sizing.
- [transcript-cloud-enterprise.md](transcript-cloud-enterprise.md) — Enterprise tier adds public/private networking, Prometheus metrics, and audit-log tooling.
- [docs-home.md](docs-home.md) — documentation home that advertises the free cloud instance ("Try FalkorDB Cloud").
- [../../guide/03-run-falkordb.md](../../guide/03-run-falkordb.md) — guide module summarizing the Cloud tiers, including Pro's replication/cluster and replica limits.
