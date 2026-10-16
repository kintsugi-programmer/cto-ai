# FalkorDB Workshop: Cluster Scale-Out and Multi-Tenancy

> **Source:** [`Transcript copy 17.txt`](../Transcript%20copy%2017.txt) · **Type:** webinar transcript · **Saved:** Oct 16, 2026 · **Original URL:** https://www.youtube.com/watch?v=LbeA0-xy1f8

## Overview

- Technical workshop on **cluster scale-out and multi-tenancy**, delivered by FalkorDB **CTO and co-founder Roy Litman**; recorded, with a Q&A session at the end.
- Builds a running demo: a **Google Drive / AWS S3-style access-management system** (users, groups, folders, files, permissions) modeled as graphs, answering the classic question — **does user X have permission to access resource Y?**
- Benchmarks the same permission-check query from a **standalone 16-core instance (~24–26k QPS)** to a **3-master cluster (~62–64k QPS)** to **96 cores (~120k QPS)**, demonstrating linear scalability.
- Demoes **multi-graph (multi-tenant) management** on a single open-source instance — creating, listing, and querying multiple graphs with `GRAPH.LIST` / `GRAPH.QUERY` against a database that manages **629 graphs**.
- Ends with Q&A covering extra replicas, isolation, sharding semantics, replica resync (**delta vs full sync**), cross-graph queries, and the overhead of many graphs.

## The demo application: access management as a graph

- The application models something familiar: **Google Drive** (photos/files with a security layer of permissions), **AWS S3 buckets**, or any OS file system — "who is allowed to access which file, what permission does user X have, and how are permissions managed?"
- The pressing question asked over and over in such systems: **does user X have permissions to some resource?**
- Graph model outline:
  - nodes for **users**, **files**, and **directories/folders**;
  - **user groups** — a user may be associated with a group, and a group may have permissions to a file or a directory.
- Multi-organization twist: FalkorDB (the company) is one organization using S3 or Google Drive with its own resources and users; other companies (e.g., Apple) have their own resources and users — and you **don't want to mix them**.

### The common pattern: one graph + discriminator labels

- Most graph vendors store **a single graph per database**, so all organizations must be packed into it.
- The common workaround: apply a **second label** to every node stating which organization owns it (e.g., a `User` labeled additionally with the organization), and the same for other entities such as files and folders.
- This mimics separation between organizations but **makes life harder**: every query must be careful to specify the organization being queried to avoid accessing data that should not be seen.
- Query example discussed: give me the set of **Apple** users that have access to files owned by Apple, and tell me how many of them.
- Disadvantages of this approach:
  - **No real isolation** — a query written without enforcing or mentioning the extra labels can glimpse data it should not see.
  - **Hard to scale** — everything is pushed into a single graph, so if the graph gets too big you may hit scaling issues.
  - **Security risks** involved overall; FalkorDB finds this approach unappealing, but some vendors leave no choice.

### Alternative: one graph per database

- If there is one graph per database, you could manage **multiple databases** and get clean separation — no data leakage and no extra labels; entities are represented as they should be.
- Problems:
  - **Costly** — you pay for every database you use.
  - **Higher maintenance** — you manage as many databases as there are customers.
  - **Extra complexity on the application server** — it must know how to connect to every single database for the currently pending interaction.

### FalkorDB's model: one database, many isolated graphs

- The desired architecture — and what FalkorDB does — is **a single database that manages multiple different isolated graphs**, referred to as multi-tenant.
- Within FalkorDB you can have multiple graphs; each graph is associated with a **unique identifier: the graph name (graph key)**. FalkorDB manages a **key space**, and clients just specify which graph they would like to query, with access subject to permissions.
- This yields an **affordable** solution (one database managed), **low maintenance**, and the isolation level this kind of application needs.

## Demo data: 629 graphs on one database

- Connected to a FalkorDB database whose graph dropdown manages **629 different graphs**; one was picked at random.
- That graph holds **148 nodes and 475 edges**; a sample (~100 nodes) was visualized with `MATCH` / `OPTIONAL MATCH` queries.
- Four node types, color-coded in the visualization: **groups (orange)**, **users (blue)**, **folders (light orange)**, **files**.
- A user node carries a **user ID, name, and email**; it has access/permission to all sorts of files and belongs to a user group — a "Google Drive-shaped" presentation of the resources and users being managed on Google Drive or an AWS S3 bucket.

## Benchmark 1 — single instance

- Setup: a **single FalkorDB database with 16 cores**, plus an application/benchmark server with **8 cores**.
- Workload: the **permission-type query** ("does this user have permission to this file?").
- Result: roughly **24,000–25,000 queries per second** — "not bad" for a single instance (the run was recapped later as ~26,000 QPS).
- Why scale out: maybe more than **700 graphs** are being managed, or the throughput is simply not enough and the instance can't cope with the load.

## FalkorDB cluster architecture

- A FalkorDB cluster presents a **single endpoint**: users are not specifically aware that they're talking to several machines — from their perspective they issue queries against one endpoint while a **fleet of servers** holds the data spread across machines.
- **Key space and slots**: every graph is associated with a key; these keys form the **key space**, which is separated into **slots**. Each slot is assigned to a single **shard (node)**, and every machine is responsible for a **range of slots / range of keys**. Keys are usually evenly distributed; if not, you can move keys or slots around.
- Scaling example: a 3-node cluster; add an additional machine and the key space is shared among four machines — some keys move in order to **rebalance the load** across the cluster.
- **Masters and replicas**: the tested cluster has **six machines** — **three masters**, each a FalkorDB database that handles both read and write operations (all writes must go through the master, and the master replicates the changes to its replicas), and **each master has its own replica**. A master-replica setup provides **high availability**: if something goes wrong and the master goes down, the replica is promoted to master quickly, minimizing downtime. "This is your classical cluster architecture."

## Benchmark 2 — three masters (~3x compute)

- The same benchmark was run against the **masters** of the cluster: **~62,000–64,000 queries per second** ("around 64, maybe 62, depending on the measurement"; measured readings ranged up to ~68–72k).
- Three times the compute power yielded roughly **three times the throughput** — "we like linear scalability".

### Why not send queries to the replicas too?

- Replicas are **not fully in sync with the master** — there is a tiny delay for the latest change to propagate from master to replica.
- Usually unnoticeable, but in some extreme cases the replica can be a tiny bit behind the master, especially when a lot of writes are coming in.
- For the majority of use cases, querying the replica is perfectly fine — just be aware that the replica is usually a tad bit behind its master.

## Benchmark 3 — 96 cores

- Doubling the compute from **48 cores (three masters) to 96 cores (all six machines)** and rerunning the benchmark: **120,000 queries per second**.
- Recap across all three steps: started with a standalone 16-core machine at ~26,000 QPS; **tripled** the cores → almost **tripled** the QPS; **doubled** the cores again → **linear scalability in queries per second**.
- Scaling stopped there because **AWS would not allow more virtual cores in that region**; Roy believes the linear scalability continues as you grow and doesn't see a hard limit — with hundreds of nodes, each query identifies the server it needs to execute against, the query is sent to that cluster node, and it runs there.

## Demo: multiple graphs on a single open-source instance

- **Multigraph functionality is available in the open-source version** — there is no distinction from the managed service on this front.
- Walkthrough (using the FalkorDB **Docker** image):
  - Start from a clean FalkorDB database; run `KEYS` to see all of the graphs (or `GRAPH.LIST`) — initially there are none.
  - Run a query to **create a graph** — named **A** — containing a person with a name; `GRAPH.LIST` now shows graph `A`.
  - Repeat the process to create graph **Z** with a **flight** whose flight number is **7822**; `GRAPH.LIST` now shows both graphs.
  - Query one graph at a time with **`GRAPH.QUERY`**: against `a`, `MATCH (n) RETURN n` returns the person; switching the target from `a` to `z` returns the flight.
- You can have **as many graphs as you want, as long as there is enough RAM** to accommodate them all — and if RAM runs out, you can fire up a **cluster** and distribute the graphs between the machines.

## Q&A

### Can I add more replicas to achieve more operations per second?

- **Yes.** The demo showed a 1:1 master-replica relation, but you are **not limited to a single replica per master** — multiple replicas can follow the same master.
- This is a way to **scale out read operations**: e.g., master number three could have **10 different replicas** following it, theoretically scaling out by **10x** the amount of read queries that can run against the graphs stored in that slot range.

### Is the multigraph functionality available in the open-source version?

- **Yes**, it is available — on that front there is no distinction between the managed service and the open source. Demonstrated live (see the walkthrough above): creating graphs `A` and `Z`, listing them, and querying each separately.

### Is there full isolation between the masters and the replicas?

- Clarified question: when I run a query, does it affect communication with other masters and replicas? **No — there is full isolation between masters and replicas.**
- Usually masters and replicas run on **different machines**, though you can run a whole FalkorDB cluster **within a single machine** (every FalkorDB process on the same host); the demo cluster used six different machines, each running a FalkorDB instance.
- A **read query on a master runs locally** — it doesn't affect anyone else in the cluster; nobody else is aware of it.
- A **write query** — adding or removing a node, introducing or removing an edge, an attribute update — **must run on the master**. Once the change is computed, the master uses its **replication link** to send the change to the replica (or replicas, if multiple follow the master).
- Master↔replica interaction therefore happens essentially when the master processed a write that changed the graph and the change needs to be replicated to keep the replicas in sync.

### Are multi-tenant graphs a good mechanism for sharding?

- Question (also asked about overlaying multiple graphs "in a similar way to how GraphBLAS handles adjacency resolution"; use case: **outlier detection across multiple data sets that as a whole wouldn't fit in a single host**). Roy asked for the GraphBLAS/adjacency part to be repeated.
- Answer: **No.** In Roy's terminology, **sharding is the process of splitting the key space among multiple machines**: with a single machine, the entire key space belongs to that single database instance; when you add more servers, splitting the key space among them is what sharding means — moving some of the data from a set of machines to a (usually larger) set of machines.
- **Multi-tenancy on a single machine is not sharding** — it's just managing multiple graphs in a single database.
- The host noted they received the question and would **circle back with Roy after the session** with an answer for the asker.

### What happens if a write is acknowledged by the master but the replica fails before applying the change?

- Assume the replica went down for some reason: the master (e.g., master #3) processed the write query and made internal changes (e.g., a new node was added), then wished to replicate the change — but the one and only replica was down, so **the change was not replicated; the master still works**.
- When the replica rejoins the cluster and reconnects with its master, there is a **resync process**, with two options for bringing the replica up to speed:
  - **Delta**: if the amount of changes accumulated while the replica was down is relatively small, the master sends the **delta** — it remembered the set of changes it wanted to send but couldn't, and replicates them to the replica.
  - **Full synchronization**: if that's not possible because the replica was down longer and the internal buffer that remembers the small delta **exceeded its limit**, the master takes a **snapshot of its entire data set** and sends it over. Slower, but necessary to get all of the data onto the replica.

### Can a query be distributed across multiple graphs and returned as one result?

- Question: is there an option to run a master query distributed between multiple graphs — within the same master or multiple masters — returned as one result instead of two separate ones?
- **No.** Within FalkorDB, a query runs against a **single graph**; you cannot run a query against multiple graphs at the same time. You can't, for example, target graphs `a, z` in one query and mix their results — the query target is a single graph.
- This is a request that comes up from time to time.

### Is there any overhead when adding more graphs?

- Adding more graphs **consumes more memory** (more data) and makes **snapshotting take longer** (more data to snapshot).
- **Query latency would not be impacted**: a single query targets a single graph, so having hundreds of graphs instead of one doesn't affect latency.

## Logistics

- The session was recorded; the recording was expected to be shared, like previous times, **within the next 24 hours**.
- Answers to all of the questions were to be compiled and distributed over **email, Discord, and the blog**.
- Sessions like this run roughly **once a month** on the hottest topics; subscribing on the **Luma** page gets you invited when they launch.
- Questions are welcome on the **Discord** server anytime.

## Key facts and numbers

- Demo database manages **629 graphs**; the sampled graph has **148 nodes and 475 edges**; visualized ~100 nodes; four node types: group, user, folder, file; user attributes: user ID, name, email; demo flight number **7822**; graphs `A` and `Z` created in the open-source demo.
- Standalone benchmark: **16-core** FalkorDB instance + **8-core** app/benchmark server → **~24,000–26,000 queries per second**.
- Cluster tested: **6 machines** = **3 masters + 3 replicas**; **3 masters (~48 cores)** → **~62,000–64,000 QPS** (readings varied, up to ~68–72k during measurement).
- **96 cores** (all six machines) → **120,000 QPS**; the three steps show **linear (near-linear) scaling** of throughput with compute.
- Further scaling not tested — **AWS vCPU limits** in the region; Roy sees no hard limit for hundreds of nodes: each query is routed to the node that owns the key.
- Scale-out example: **10 replicas** on a single master → theoretically **10x** read-query throughput for that slot range.
- Motivation example: deployments with **more than 700 graphs**.
- Resync options: **delta** (small accumulated changes, remembered by the master) vs **full synchronization** (snapshot of the entire data set when the internal buffer limit is exceeded).
- Replica caveat: not fully in sync — small replication delay, most noticeable under heavy writes.
- Logistics: recording shared within **~24 hours**; answers via email/Discord/blog; sessions ~**monthly** on Luma.

## Hackathon relevance

- The **permission-check model** (users, groups, folders, files, and ACLs as a graph) is a ready-made template for the **company brain** track: answer "can X access Y?" with a single graph traversal instead of app-side permission logic.
- FalkorDB's multi-tenant model lets every hackathon team, agent, or demo user get a **dedicated graph** on one open-source instance — isolation without extra databases; `GRAPH.LIST` and `GRAPH.QUERY` are all you need to manage them from the client.
- For **agent memory and coordination**, the scale-out path is quantified: tune queries → add read replicas → shard graphs across cluster masters, with near-linear throughput as the payoff.
- Know the durability caveats when designing against replicas: **replica lag** under heavy writes, and **delta vs full sync** behavior when a replica falls behind.
- **No cross-graph queries** — if an agent needs to combine data from multiple tenants/graphs, query each graph separately and merge results in the application.

## Related notes

- `transcript-falkordb-ama.md` — the AMA answers kindred multi-tenancy, sharding, and scaling questions and introduces the same Redis hash-slot model.
- `docs-docker.md` — how to run the Docker image used for the open-source multi-graph demo.
- `../../guide/02-falkordb.md` — guide module introducing FalkorDB's architecture for agent context.
