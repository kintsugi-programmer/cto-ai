# FalkorDB Cloud — Enterprise tier walkthrough

> **Source:** [`Transcript copy 7.txt`](../Transcript%20copy%207.txt) · **Type:** webinar transcript · **Saved:** Oct 16, 2026 · **Original URL:** https://www.youtube.com/watch?v=fu_8CLFKYSs

## Overview

- Short screen-recording walkthrough of spinning up a **FalkorDB Cloud** instance on the **Enterprise plan** and exploring it in the Browser — a demo/onboarding video with no speaker intro, code, or Q&A.
- Flow shown: log in → **instances window → Create** → subscribe to Enterprise → choose **public or private network** / custom network → size the node instance, name it, set admin credentials → Create → instance report → Browser with the copied endpoint → Prometheus metrics and audit logs.
- Enterprise's differentiator vs other plans: a **public or private network** choice in the **network connectivity** section. A **custom network** is available **but must be created before creating the new database instance**.
- Operational extras shown: the first endpoint connects to the database, the **last endpoint queries Prometheus metrics**, a **nodes tab** monitors each cluster node's health, and an **audit logs tab** gives a detailed trail of user actions.
- Closing pitch aimed at the hackathon audience: **multi-tenancy** — "normally reserved for enterprises in competing graph databases" — "is readily available to you even in the free tier".
- Named use-case spaces: **cyber security, agentic AI, and identity management**, where the database handles "tough multihop queries with ease and at jaw-dropping speeds".

## Setup flow

### 1. Sign in

- Start by logging into your FalkorDB Cloud account.

### 2. Create and subscribe to Enterprise

- Inside the **instances window**, hit **Create**.
- Under the **subscription plan panel**, subscribe to the **FalkorDB Enterprise plan** to get started.

### 3. Configure the deployment

- Now you're ready to customize your instance. Differently from other plans, Enterprise allows you to **select a public or private network** in the **network connectivity** section.
- You can also customize:
  - **Deployment region type** and other important parameters for your use case.
  - **Size of the node instance**.
  - **Instance name** and **admin user credentials**.
- **Custom network caveat:**
  - A custom network is available but **must be created before creating this new database instance**.
  - The customer network you set up before spinning up the new instance **appears in the customer network drop-down list**.

### 4. Launch and save the instance ID

- When done customizing, click the **Create button on the right** to spin up the instance — it **should take a couple of minutes**.
- Recommendation: **keep a copy and save your instance ID**.

## Instance report and Browser walkthrough

### Comprehensive instance report

- Once live, click on the **instance name** to display a **comprehensive instance report** covering:
  - **Key details**.
  - **Connectivity**.
  - **Nodes**.
  - Other relevant information.
  - **Endpoints**.
- Also copy the endpoint from the **Connectivity tab** before switching tools.

### Browser walkthrough

- Switch to the **FalkorDB Browser** and **paste the endpoint you copied** from the Connectivity tab in the previous step.
- The FalkorDB Browser enables you to **visualize your graph**.
- **Zoom in and right-click on any node** to reveal its **attributes panel**, which you can **consult or modify at any time**.
- The **menu on the right** contains **smart filters** that help you focus on **specific groups of edges**, expediting the exploration process.
- Click the **History button** to view **past queries and their performance metrics**, such as **total runtime**.

## Endpoints, metrics, and monitoring

- **Endpoints rule of thumb:** use the **first endpoint to connect to the database** and the **last one to query the Prometheus metrics**.
- **Nodes tab** — monitor the **health of each node in the cluster**.
- **Audit logs tab** — provides a **detailed audit trail of user actions** that you may want to track.

## Key facts and numbers

- Plan selection: Enterprise under the **subscription plan panel**; entry via **instances window → Create**.
- Enterprise-only networking: **public or private network** choice in **network connectivity**; **custom network must be created before** the database instance and then appears in the **customer network drop-down list**.
- Create-time options: deployment **region type** and other parameters, **node instance size**, **instance name**, **admin user credentials**.
- Provisioning time: "a couple of minutes"; **save your instance ID**.
- Instance report contents: key details, connectivity, nodes, other relevant information, **endpoints**.
- Browser entry: switch to Browser and **paste the endpoint copied from the Connectivity tab**.
- Endpoints: **first endpoint = database connection**, **last endpoint = Prometheus metrics**.
- Monitoring: **nodes tab** shows health of each cluster node; **audit logs tab** shows a detailed audit trail of user actions.
- Query history: **History button** shows past queries with performance metrics such as **total runtime**.
- **Multi-tenancy is available even on the free tier** (otherwise an enterprise-class feature in competing graph databases).
- Claimed strengths: tough **multihop queries** with ease and **jaw-dropping speeds**.
- Use-case spaces named: **cyber security, agentic AI, identity management**.
- Closing offer: "If you've got any questions, we're right here to help."

## Hackathon relevance

- **Private networking** plus a pre-created custom network is the compliance-flavored story for a "company brain" track where the graph holds sensitive internal context.
- The **last endpoint's Prometheus metrics** give judges a real observability story — hook scrape targets to a dashboard and show agent query behavior under load.
- **Audit logs tab** supports claims about tracking who (or which agent) touched which data, useful for the agent-memory and company-brain narratives.
- **Nodes tab** cluster-health monitoring helps diagnose slow agent responses during a live demo before they become failures.
- The Browser's **smart filters on the right** and **node attributes panel** make edge-group exploration fast when narrating a connected-data graph; **History** shows total-runtime numbers for multihop queries.

## Related notes

- [transcript-cloud-free.md](transcript-cloud-free.md) — the default tier walkthrough; its closing pitch about free-tier multi-tenancy is repeated in this video.
- [transcript-cloud-startup.md](transcript-cloud-startup.md) — Startup tier with TLS toggle, persistence tuning, and memory sizing.
- [transcript-cloud-pro.md](transcript-cloud-pro.md) — Pro tier with replication vs cluster, single/multi-zone, and up to two replicas.
- [docs-home.md](docs-home.md) — documentation home that advertises the free cloud instance ("Try FalkorDB Cloud").
- [../../guide/03-run-falkordb.md](../../guide/03-run-falkordb.md) — guide module noting Enterprise's public/private network option and custom-network requirement.
