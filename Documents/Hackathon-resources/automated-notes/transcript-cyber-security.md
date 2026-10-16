# Graph Algorithms for Cyber Security — WannaCry, Log4Shell and Max Flow

> **Source:** [`Transcript copy 2.txt`](../Transcript%20copy%202.txt) · **Type:** webinar transcript · **Saved:** Oct 16, 2026 · **Original URL:** https://www.youtube.com/watch?v=aFkgUT0ubYY

## Overview

- FalkorDB webinar with three cyber-security scenarios solved on graphs: (1) simulating **WannaCry ransomware spread** through a corporate network with a Monte Carlo model + JavaScript UDF, (2) tracing **Log4Shell** through a Maven dependency graph, and (3) estimating the **maximum data leakage** from a compromised machine with the **max-flow** algorithm.
- Presented by FalkorDB's CTO and co-founder **Roi Lipman** with the head of the solution-architecture team; the host opens the session and moderates Q&A.
- The demos exercise FalkorDB-specific machinery: user-defined functions that run custom **JavaScript inside the database**, sparse-matrix relationship lookups, variable-length traversals that **track cycles**, and built-in algorithms backed by **GraphBLAS/LAGraph**.
- Q&A covers built-in algorithms vs UDFs (and the performance trade-off), modeling appliance logic (firewall/NAT/load balancer) inside UDFs, circular dependencies in directed graphs, hop/node limits and `LIMIT 1`, how UDFs are registered and invoked (`falkor.register`, `graph.traverse`, `getNeighbors`), and combining UDFs with loop limits.
- Useful for anyone building security- or network-analysis tools on graphs — or anyone who needs custom algorithms and traversals inside FalkorDB.

## Session context

- **13th episode** of FalkorDB's podcast/webinar series ("graph and rack talks" as heard [unclear]); a similar session had been held the night before, with good questions.
- Presenters: **Roi Lipman**, FalkorDB's CTO and co-founder (the ASR renders the name "Roy Litman"), and **Shahal Piron** [name as heard], who heads the solution-architecture team; the host is **Dan**.
- FalkorDB is described as an **open-source, multi-tenant, ultra-fast graph database that is Redis-based**.
- Recorded session: available **within 24 hours** on the YouTube channel and Discord; questions can go in the chat or Q&A.
- Demos run in **FalkorDB Browser** (graph UI) and a separate UI showing the algorithm/flow-network results.

## Demo 1 — Ransomware (WannaCry) spread simulation

### How WannaCry works

- WannaCry (the talk says "WannaCry version two") is ransomware that, for the attack to be really meaningful, **acts like a worm**: it encrypts local files and then tries to spread through the network.
- The attack usually starts with a **patient zero** running a file they should not have (e.g., an employee opened an email and ran an executable).
- Once running, the ransomware searches for files — targeting specific types such as **documents, Excel files, emails** — encrypts them, tells you that you have been compromised, and asks for a **ransom**.
- WannaCry 2 exploited a vulnerability in the **SMB protocol**; the exploit got the name **EternalBlue** and allowed **remote code execution** on the compromised machine.
- The malware **clones itself** and the process repeats — cloning gives it a higher chance to keep spreading through the network.
- Anecdote: WannaCry infected the presenter's wife's previous employer — one employee opened an email and ran an executable, the ransomware infected their file servers, all files were encrypted, and eventually they **paid the ransom** to get their files back.

### The network graph model

- Goal: simulate what would happen in an organization's internal network when such malware gains access — for that, build a graph representing a computer network.
- Kept simple: just **two entity types**:
  - **Host** — a machine, carrying metadata used throughout the simulation to predict the chance of that host being compromised/affected by the ransomware.
  - **CVE** — attached to a host **if the host was not patched for that specific CVE**; the ransomware can exploit CVEs, increasing its chances of spreading.
- Shown in **FalkorDB Browser**: host nodes are **purple**, vulnerability (CVE) nodes are **pink**; each node has its metadata attached.
- Edges: **host ↔ host** (this host can communicate with that host) and **host → CVE** (this host was not patched for that CVE).
- The question the simulation answers: if a specific workstation is infected with ransomware, **how extensively will it spread**?

### Stochastic infection and the Monte Carlo model

- The simulation is a **stochastic infection**; a **Monte Carlo** model estimates how likely it is for a workstation to be infected.
- There is randomness in the simulation: run it **multiple times**. If a host (e.g., **host 10**) is marked as infected in a high percentage of runs, there is probably a great likelihood that this host should be looked into — and probably patched.
- Probability of a target being infected, from the formula shown:
  - if there is **no firewall link** → probability **increases by 2**;
  - if **SMB signing is disabled** → an additional increase of **0.15**;
  - **CVE vulnerabilities** are taken into account;
  - **EDR** is also taken into account.
- Think of this function as giving a probability for a node to be infected.

### The `blast_radius` UDF

- The simulation runs **inside the database** through a **UDF (user-defined function)** — FalkorDB supports adding **JavaScript logic** to graph queries, and that logic encapsulates the entire simulation in a single function.
- The function is called **`blast_radius`**; it expects:
  - the **patient zero** — the node that started the entire infection, and
  - the **number of runs** to simulate.
- How it works: traverse the graph starting with patient zero as the **frontier**; collect all nodes connected to patient zero; for each neighbor, compute the **spread probability** with the formula above.
- The random part: think of **throwing a die** and asking whether the die falls beneath the probability of that neighbor being affected — if the probability is high, it's likely the die hits.
- On a hit: the workstation is marked **infected**, added to the **next frontier**, and the spread continues from it.
- The UDF is invoked as part of a query, run for the demo through a **Python driver** script ("run simulation") that executes the query.
- The query: provide the **patient zero ID**; match it in the graph; run the UDF; return the UDF result.

### Demo results

- Patient zero = **host zero**, run it: **40 runs completed**; **host 12 got infected 36 times out of 40 → a ~90% probability** of being affected/infected.
- Use this to get a list of candidates worth looking into as a precaution.
- The result is not deterministic: rerunning gives slightly different numbers, but they stay close/consistent because of the large number of runs; increase the number of runs and the numbers should become pretty much consistent.
- Changing the patient zero to another node — say, **host 12** — yields a **different set of hosts**, reflecting the different connectivity between machines in the network.

## Demo 2 — Log4Shell dependency paths

### Log4j and the Log4Shell exploit

- **Log4j** is an extremely popular logging library for Java, widely adopted. Usage is either **direct** (you imported it and use it for logging) or **indirect** (you use it unknowingly through a dependency that relies on it).
- Log4j lets you specify a string to log, with variables: **curly braces** specify the variable to insert into the log (a dollar-sign syntax is also available); the demo just logs the **Java version**.
- The exploit uses the fact that Log4j allows expressions that refer to **JNDI lookups**. JNDI basically allows fetching **remote Java objects**, and Log4j would evaluate the object — giving an attacker the ability to perform **remote code execution** if the application doesn't filter out malicious input (think chat applications or any app where user input is provided: a crafted input might end up running remote code).
- Once exposed, people started calling it **Log4Shell**.
- Severity: the CVE got the **highest severity score**, because:
  - it allows remote code execution;
  - **no authentication is required** (this might depend on the underlying application, but generally none is required);
  - it can be triggered **over the network**;
  - the complexity to execute it is **extremely simple**.

### Dependency vulnerabilities and the tools

- The broader field is **dependency vulnerabilities**: your application has a bunch of dependencies, and those dependencies have their own dependencies — you may have no idea you're using a vulnerable library because you don't use it directly.
- Tools were invented to give insight into the **indirect/direct dependencies** you're bundling in:
  - **GitHub's dependency bot**,
  - **Trivy** (which FalkorDB actually uses),
  - **Snyk**.
- They usually work by building the **dependency graph**.

### The Maven dependency graph demo

- FalkorDB built a **Maven dependency graph**. You can search for a Maven artifact (e.g., Log4j), pick one of its versions, expand to see other libraries depending on it, and continue investigating **up the dependency graph**.
- Those tools essentially do simple **graph path finding**.
- Demo search 1: pick a popular Java library — **Flink** (no specific version) — and search for a path to **Log4j** (no specific version) with a **maximum length of 8 hops**. A path exists: **1-2-3-4-5-6 hops** — a **6-hop path** between Flink and Log4j.
- Demo search 2: **Lift** depends on **lift-common**, which uses Log4j — another path found.
- These graphs are extremely easy to build from the information in package managers and library repositories; it's **not unique to Java** — the same can be built for **npm** (Node) or **NuGet** (.NET). The queries themselves are pretty straightforward to execute and give insight into whether you're using a vulnerable dependency.

## Demo 3 — Max flow: how much data could leak?

### The scenario

- Assess how much data might leak from an internal network if one internal node is compromised. Say we detect a data leakage **after 30 seconds** and were able to get a hold of it.
- The question: theoretically, what is the **maximum amount of megabytes** that could have leaked out of the network, given all network constraints — routers, firewalls, or any other type of network appliance?

### The network graph

- Two **databases** (one and two), connected to a **file server** — this one holds backups of the two databases.
- A **server node** — some internal application.
- The file/backup server and the internal application server connect to a **VLAN router**.
- The **compromised machine** in the network doesn't have direct access to the outside world; it managed to find a link to leak data out through several other machines:
  - a **reverse proxy**,
  - a **public web server**,
  - an **FTP server** — all three sit behind a **firewall** that has access to the outside world.
- There's another machine the attacker can use to leak data out (a jump server, "cisadmin" as heard [unclear]) — it **doesn't sit behind the firewall** (maybe a misconfiguration), but it has access to the outside world.
- Edge model: only **one type of edge** — **`communicate`** ("these two nodes can communicate with each other"). Each edge has a **bandwidth** attribute in **Mbps**: how much data can flow every second on it.

### The max-flow algorithm

- **Max flow** constructs a **flow network**: take the computer-network graph and add two additional nodes — a **source** and a **sink**.
- Think of the graph as a **piping system** where water flows from source all the way to sink; edges have **capacities** telling how much water can pass through each pipe. The question: what is the **maximum flow** that can reach the sink?
- Here the capacities are the **bandwidths** specified in the original graph.
- Exercise: the max flow for this network is **10** — sum the flow across all edges coming into the sink (or all edges coming out of the source): **6 + 4 = 10**.

### Demo results (first run)

- The UI shows the flow network. The resource node is only able to push **18 MB** against a capacity of **100**.
- Because of the network constraints, to maximize egress, the algorithm determined data would leak **only from the HR and payroll database** — although three resources could have leaked (the two databases and the internal app server).
- The leak path: HR/payroll database → file backup server → VLAN router → compromised machine → out:
  - via the **jump server** that doesn't sit behind the firewall — using **all of its bandwidth** (**8 MB** as heard),
  - plus just **10 more MB** pushed out through the **reverse proxy and the public web server** behind the firewall; the **firewall is fully saturated: 10 MB out of 10 MB**.
- **Total: 18 MB per second.**

### Changing the constraint (second run)

- Change: increase the firewall bandwidth from **10 MB/s** to **19 MB/s** and rerun the algorithm. [The later reading — the firewall edge at **52 MB out of 90** — suggests the new capacity may have been **90 MB/s**; the ASR is ambiguous between "nineteen" and "ninety" [unclear].]
- After the rerun: not only does data leak from the **internal app server** — now the **HR and payroll database** leaks too.
- The edge connecting the database to the file server is **fully saturated: 40 out of 40**; through the **VLAN**, full saturation again.
- Both the internal app and the database leak via the compromised machine; from it to the outside world, the **reverse proxy now moves 15** [as heard].
- The **firewall edge is now leaking 52 MB out of 90** [as heard; see the note above].

### Takeaway

- Flow networks are more versatile than they look — "you can do really cool things with them". FalkorDB implemented the flow-network algorithm as part of preparing for this webinar.
- Use this to get a **theoretical upper limit** on the amount of data being leaked out in case a node or workstation in the network is compromised.

## Q&A

### Is max flow computed inside FalkorDB as a UDF?

- No. FalkorDB's algorithms divide into two groups:
  - **Baked-in (built-in) graph algorithms** — highly performant; they take advantage of the underlying **GraphBLAS** library, which represents the graph as a set of **sparse matrices**, and use **sparse linear algebra** to compute results. Most of these algorithms come from **LAGraph**, a library that writes classical graph algorithms in the language of linear algebra.
  - Algorithms that **LAGraph does not accommodate**, or that aren't implemented yet on top of GraphBLAS, can be implemented as **UDFs** — with the downside of a **performance hit** when transitioning from C/C++ code into JavaScript.
- This answer also covered a request to speak more about the engine behind the scenes (GraphBLAS).

### What about networks where devices manipulate traffic (firewalls, NAT)?

- Question: in a trivial path lookup you follow the connects-to relations — what about networks where devices can manipulate traffic, like a firewall or NAT? Do you need to reflect that logic into nodes and edges for such graph algorithms to work? Break each problem into a path-finding problem, or use multiple queries?
- Answer: the graph itself only models the **topology**; it does not encapsulate the logic inside a certain appliance. You can do that with **UDFs**:
  - for a custom traversal that accounts for appliance logic — a firewall dropping a packet, a router whose configuration changes and now reroutes data, or a load balancer doing round-robin against a set of servers — implement your own logic in the UDF and, when the traversal reaches such an appliance, run the appliance logic and determine how to continue the traversal.
- Team follow-up: multiple customers use UDFs for **custom traversals**, either by extending BFS or with other customizations, to bake their own **attack-path** or **costing** algorithms into the graph traversal — quite a common use case.

### Circular dependencies in directed dependency graphs

- Question (Brett Broly): dependency graphs are directed — how do you handle circular dependencies within the same query? The asker had to break queries up and use a visitor pattern; is there a way to avoid this?
- Answer: the dependency lookup used a **variable-length traversal** with a **max-hops limit** you can set. The query (shape): match a path `p` from some source artifact, following the **`depends_on`** edge, with any path of length **0 up to 8** — the maximum length you're willing to traverse hoping to reach the destination library (Log4j here).
- Circular dependency handling: **variable-length traversals in FalkorDB track cycles**. The semantics: you're allowed to **close a circle**, but **not to expand further once the circle is closed** — the traversal does not continue past a closed cycle; it retracts and looks at other paths.

### The 10k node limit and fan-out

- Follow-up: with max hops, the asker ran into a limit of about **10k nodes**.
- Answer: FalkorDB **does not enforce a limit** — you're only limited by the amount of time you're willing to wait and the machine resources you have. A 10k-hops-deep traversal sounds extremely expensive; maybe rephrase or remodel the problem.
- Clarification: it wasn't 10k hops — it was the **explosion of nodes** (the fan-out).
- Response: 10k is **more than reasonable**, not a large search space. One thing to take into consideration: if you just need to understand **whether or not there is a path**, notice the **`LIMIT 1`** — once a single path is detected from source to target, that's it; don't continue traversing. If you need more, increase the limit; if you need all of them, drop the limit — and that's where **query time might extend extensively**.

### Do UDFs attach to nodes, or run per query?

- Question: do we add UDFs to the actual node, so that running a query will always run them — or is this something sent at runtime, embedded in the query?
- Answer: no — a UDF is **not associated with a particular node**. UDFs exist in other databases too (even relational ones): they are a way to extend the built-in functionality the database provides (string manipulation, mathematical functions, and so on). The UDFs discussed perform **custom traversals**, because Cypher has limits in the types of traversals and patterns you can specify; when you need something very custom with high resolution in how to continue your traversals, introduce a UDF.
- UDF mechanics from the demo:
  - UDFs come in the form of a **library**; you can have as many UDF libraries as you want. The demo library is **`blast radius sim`**, containing a single `blast_radius` function. You can add additional functions to a library, or additional libraries to your database.
  - They are written in **JavaScript**.
  - Register UDF functions in the library by calling **`falkor.register`** ("falco register" in the ASR), providing the **name** for the UDF and a **pointer to the function**.
  - Inside, you're free to run any JavaScript code; the API gives access to graph interaction and to **any data type the database supports** — you can pass in nodes, edges, paths. The example's `start_node` is an actual node object.
  - **`graph.traverse`**: `graph` is an object representing the graph being queried; its `traverse` function takes an **array of nodes** and a **configuration** telling it how to traverse.
  - Usage: write a query that matches patient zero (a host with a host ID, e.g., `01`), then call the UDF by name (`run_sim`) passing patient zero and the number of simulations. UDFs are treated like any other function: usable in a `WHERE` clause (e.g., `> 30`), or to update an attribute (`p.probability = blast_radius(p.id)` style, as described) — extremely flexible.

### Combining a UDF with a loop limit

- Question (final): how do you combine a UDF with a loop limit? In some cases the asker needs a loop where a specific node can take a different traversal direction in each iteration.
- Answer: if the entire traversal is written as a UDF, there are multiple ways (see the UDF documentation):
  - on a **node object**, call **`getNeighbors`** — you can specify whether you want **outgoing**, **incoming**, or **both** edges, and collect the direct neighbors;
  - use the **`graph.traverse`** API — pass a node or a set of nodes; it performs **multi-source BFS**, with a configuration controlling how you traverse.
- If everything is encapsulated in the UDF, you can **keep track of a limit** in your custom traversal — expand how you want and enforce your own limit. After the UDF returns, data goes back to the query engine, where you can also have a limit: e.g., "I've run this UDF four times, my limit is four, I'm not going to call the UDF again". So: limits inside a UDF and limits outside a UDF.

## Key facts and numbers

- WannaCry ("version two"): SMB protocol vulnerability; exploit named **EternalBlue**; remote code execution on the compromised machine; malware clones itself; patient zero runs an unwise file; targets documents, Excel files, emails; asks for ransom.
- Infection probability rules: **no firewall link → +2**; **SMB signing disabled → +0.15**; CVE vulnerabilities factor; EDR factor.
- Monte Carlo simulation: **40 runs**; **host 12 infected 36/40 = 90%**; host 10 given as the example of a high-percentage candidate.
- Leak-detection window in the max-flow scenario: **30 seconds**.
- Log4Shell: JNDI lookups fetch remote Java objects which Log4j evaluates → remote code execution; **no authentication required**; triggerable over the network; extremely simple to execute; **highest severity** CVE score.
- Dependency tooling: GitHub dependency bot, **Trivy** (used at FalkorDB), **Snyk**; **Maven** dependency graph; **Flink → Log4j within an 8-hop cap, found in 6 hops**; **Lift → lift-common → Log4j**; same approach works for **npm**/.NET **NuGet**.
- Dependency traversal: path length **0..8** hops; `LIMIT 1` to stop at the first found path; 10k-node fan-outs are normal.
- Max flow: exercise answer **6 + 4 = 10**; resource node pushes **18 MB against a capacity of 100**; total **18 MB/s**; jump server uses **all bandwidth (8 MB)**; firewall saturated at **10/10**; rerun after raising firewall bandwidth **10 → 19 MB/s** (with a **52/90** reading [unclear]); database → file server edge saturated **40/40**; VLAN saturated; reverse proxy **15** [as heard].
- UDF names: library **`blast radius sim`**, function **`blast_radius`**, invoked as **`run_sim`**; patient zero host ID example **`01`**.
- Engine: built-ins on **GraphBLAS** (sparse matrices, sparse linear algebra) and **LAGraph**; UDFs run JavaScript with a C/C++ → JavaScript performance penalty.
- Series: **13th episode**; recording available **within 24 hours**; workshops roughly monthly with a lineup through **June**; UDF deep dive the previous month.

## Code, commands and queries

The demo code was shown on screen; this transcript is ASR text, so exact syntax is not preserved. The blocks below follow what was described, with product names normalized.

- The blast-radius simulation query (shape as described — match patient zero, then call the UDF with the node and the run count):

```cypher
MATCH (p:Host {host_id: '01'})
RETURN run_sim(p, 40)
```

- Registering a UDF inside a library (name + pointer to the function; "falco register" = `falkor.register`):

```javascript
falkor.register('run_sim', blast_radius)
```

- Dependency path search (**max 8 hops**; `LIMIT 1` stops at the first path found):

```cypher
MATCH p = (source)-[:depends_on*0..8]->(dest)
RETURN p
LIMIT 1
```

- UDF traversal APIs mentioned: **`graph.traverse(nodes, config)`** — multi-source BFS from an array of nodes with a traversal configuration; node **`getNeighbors`** — outgoing / incoming / both edges; both usable to build custom traversals and enforce custom limits inside a UDF.
- UDFs can also be used like any other function: inside a `WHERE` clause (e.g., `> 30`) or to update an attribute (`p.probability = blast_radius(p.id)` style).
- Max flow: implemented by the team ahead of the webinar; the flow network is the network graph plus added **source** and **sink** nodes, with capacities taken from the edge **`bandwidth`** (Mbps) attributes.
- Graph model edges: **`communicate`** (host/network graphs); **host → CVE** links for unpatched hosts; **`depends_on`** for the Maven dependency graph.

## Hackathon relevance

- Wrap custom algorithms in **UDFs**: risk scoring, simulations, and appliance-aware traversals run as JavaScript inside the database — no data export.
- A Monte Carlo "blast radius" function is a ready-made agent tool for the connected-data track: "how far does it spread / what breaks if this is compromised?"
- Dependency and attack-path search (`depends_on*0..8` + `LIMIT 1`) maps directly to company-brain questions over services, packages, and code.
- Max flow answers capacity questions (bandwidth, budget, throughput) with explainable path output — a good algorithm-as-a-tool example for agent memory and coordination.
- Cycle-tracking variable-length traversals plus UDF-enforced limits are the pattern for bounded custom walks over agent memory (frontier expansion, multi-source BFS).
- Prefer built-in algorithms (GraphBLAS/LAGraph-backed) when one fits; use UDFs for custom logic and account for the JavaScript performance hit.

## Related notes

- `docs-graph-algorithms.md` — the built-in algorithm suite (including MaxFlow) and the matrix-based internals referenced in the Q&A.
- `transcript-udf-farm-to-table.md` — companion webinar on writing FalkorDB UDFs in JavaScript (`falkor.register`, traversal APIs, limits).
- `../../guide/09-graph-algorithms.md` — guide module on algorithms as agent tools, including the ransomware scenario.
- `transcript-cyber-security-copy-5-dup.md` — duplicate transcript of this same session (byte-identical saved copy).

## Logistics

- Session recorded; made available **within 24 hours** on FalkorDB's YouTube channel and Discord (also shared via Luma, Discord, and email).
- **13th episode** of the podcast/webinar series ("graph and rack talks" as heard [unclear]); a similar session was held the night before.
- A UDF deep-dive webinar was recorded the previous month; its recording was shared in the follow-up email.
- FalkorDB holds such technical workshops **once a month**, with a lineup through **June** — including a use case with "open claw" memory, an agent that wins government contracts [unclear].
- Leftover questions are collated and answered offline via **Discord, LinkedIn, Reddit, or email**.
- All demo code lives in a public GitHub repository called **`webinars`** — nothing is gated; fully open source as an ethos.
- Sign up on **Luma** to get invited to events as soon as they are published.
