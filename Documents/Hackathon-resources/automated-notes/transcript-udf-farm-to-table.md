# FalkorDB User-Defined Functions (UDFs): Farm-to-Table Produce Freshness Demo

> **Source:** [`Transcript copy 3.txt`](../Transcript%20copy%203.txt) · **Type:** webinar transcript · **Saved:** Oct 16, 2026 · **Original URL:** https://www.youtube.com/watch?v=r_5WuM7OBFU

## Overview

- Webinar session introducing **user-defined functions (UDFs)**, a relatively new FalkorDB feature, presented by **Roy Litman** with host **Dan** (FalkorDB).
- The host frames the demo as a "farm-to-table" use case (captions render it "form to table"); what the demo actually models is **produce moving from a farm through one or more processing hubs to a store**, with freshness decay, threshold-based path pruning, and delivery-cost computation. The collection index label "form-to-table" refers to this farm/hub/store produce demo.
- Core message: UDFs run custom JavaScript **inside the database** and enable things pure Cypher cannot easily do — most importantly, **pruning paths while they are being computed** (e.g., abandon a hub subtree if produce would arrive below a freshness threshold).
- Full workflow shown: write UDFs as separate JavaScript files → bundle and load them as a **UDF library** → list/remove them via commands and official clients → invoke them inline in Cypher as `farmtotable.find freshest path(...)`.
- Ends with a Q&A on the JavaScript/QuickJS engine choice, security sandboxing, read-only restrictions, execution/memory caps, cross-graph scope, cluster replication, persistence, and how UDFs compare to Neo4j's approach.
- The **`flex`** community UDF library (string, collections, map, similarity, temporal, bitwise utilities) is presented as a contribution-friendly starting point.

## What UDFs are and why they exist

- UDF = **user-defined function**. The concept has been around in databases for quite some time; vendors introduced it to **bridge the gap between user requests and built-in database functionality**.
- If a user asks for a function the database lacks, FalkorDB evaluates whether the request is valid and serves the general public — if yes, it may be added as a built-in. But some requests are **too specific** — they cannot be accommodated, or would take too long to add. UDFs give users the power to implement whatever functionality they need **inside the database**.
- UDFs are especially powerful when they expose a **lower-level API** to interact with database components: "that's pretty much what we've done."
- **Libraries, not standalone functions:** UDFs are grouped into **UDF libraries**. You load a library, and it contains one or (hopefully) more UDF functions. Example: a **collection utils** library that contains four functions — `intersect`, `union`, `shuffle`, `zip`. This is how FalkorDB manages and structures UDFs.
- **Language:** JavaScript is FalkorDB's engine and programming language for UDFs.
- **Full type access inside a UDF:** every data type FalkorDB supports — primitive types (strings and other scalars), arrays, and dictionaries — plus graph primitives: **node, edge, and path objects**, which carry additional APIs.
- **Graph traversal API:** you can traverse a graph from within a UDF. Motivation: Cypher has limitations for very specific traversals (e.g., a complex condition deciding whether to take the next hop). Such traversals can be very difficult or outright impossible in Cypher; the UDF graph traversal API makes them easy.
- **UDFs can call one another** — all UDF functions are visible to one another.
- **Scope:** one FalkorDB database can manage multiple graphs, but UDFs are **not imported at the graph level — they are shared across the entire database**.
- **Replication and persistence:** UDFs are replicated in a cluster (load once on one node → replicated) and persist across backup/restore (the persistency file includes your UDFs).

## Demo use case: farm-to-table produce freshness

### Graph model

- An application that moves produce (fruits and vegetables) from a **farm** all the way to the customer at a **local store**.
- Only three node types: **farm** (where produce is made), **hub** (processing hub; produce may pass through one or several), **store**.
- One edge type only: **connected** — connecting the two nodes.
- Goal: find a path from a farm to a store **through possibly multiple hubs** such that produce is delivered **as fresh as possible**.

### Metadata on the graph

- **Edge metadata:** a **travel time** (e.g., how long a truck takes to move from a farm to a hub) and the **average temperature** measured along that path/edge.
- **Node metadata:** a **processing hub has a processing delay** — how much time produce takes to leave that hub to the next leg.

### Freshness formula (decay)

- Produce start at the farm with a freshness level of **100**.
- Freshness decays along the way; each edge contributes **travel time × average temperature / 10**, and each hub contributes its **processing delay**:

```text
freshness = 100 − Σ legs (travel_time × average_temperature / 10) − Σ hubs (processing_delay)
```

- Example on the slide: computing the freshness score of a particular path yields **73.7**.

### Threshold pruning

- Because this is a path-finding question, you can place a **threshold**: if a path's freshness level falls below it, disregard the path to maintain a higher freshness level.
- In the demo this becomes subtree pruning: start at a farm, reach a hub, see that just reaching this hub would put freshness **below the threshold**, and tell the UDF to **not explore the subtree spanning from that hub**.
- **Pure Cypher limitation:** pruning paths as they are being computed is extremely hard / "practically impossible" in Cypher — you cannot easily discard a subtree from the current node and keep searching. With pruning, the overall lookup would be much faster; UDFs make this possible.

### Delivery cost formula

- Per leg (and accumulated over the whole path):

```text
if distance ≤ 50:      cost = $10
elif distance ≤ 200:   cost = distance / 2          (half the distance)
else:                  cost = 0.4 × distance + 50   (distance × 0.4, plus 50)
if refrigerated:       cost = cost × 1.2            (+20% for that leg)
```

- The demo graph: three farms (colored purple), each farm connected to at least one hub, some hubs connected to other hubs; the three farms are on the left side of the visualization.

## The three demo UDFs

Each UDF is written in its own JavaScript file: **`calculate path cost`**, **`find freshness path`** (exposed as **`find freshest path`**), and **`generate manifest`**. All three are bundled into one library named **`farm-to-table`**.

### Writing and registering UDFs

- A JavaScript file can define **as many functions as you want**; only the ones you want exposed to queries need to be **registered**.
- Registration uses a **global `falkor` object with a `register` function**, called once per UDF you want to expose. It accepts the **exposed name** — usually the same as the function name, but it can differ (e.g., register as `XYZ` and invoke `XYZ` instead of `find freshest path`).
- Registered functions become invocable from Cypher by prefixing the **library name**: `farmtotable.find freshest path(...)`.

### Loading the library (demo step)

- A simple **Python script** reads the content of each JavaScript file, **bundles all of them into a single string**, and calls the **UDF load function** in the FalkorDB client.
- You must specify the **library name** and the **library content**.
- Demo output: `UDF loaded` → library **`farm to table`** — then the **UDF list** function shows the available UDFs: three different UDF functions. Perfect.

### `find freshest path`

- Finds the freshest path between a given **farm** and a given **store** node.
- Signature (as described): accepts a **start node** (usually a farm), a **target node** (probably a store), and a **threshold** used to prune paths (e.g., disregard paths that cannot achieve 60% freshness).
- Algorithm: a **multi-source BFS-type traversal**, calling `traverse` recursively from the start node:
  - The start node is a **node object**, so attributes are accessed like JavaScript fields — e.g., `start_node.initial_freshness` fetches the attribute value from the node.
  - State: the **path** (initially an empty array) and a **visited list** (do not revisit nodes already visited).
  - At each step: check whether the current node **is the target node** by comparing **node IDs** (metadata access).
  - If the target is reached: compare current freshness against the **maximum freshness found so far**; if better, **update the best path** and return.
  - Otherwise: use the traversal API's **`get neighbors`** on the current node — you can ask for **nodes or edges** and specify **direction** (here: outgoing edges only).
  - For each edge: get its **target** (the neighbor node), add the neighbor to the **visited list** (so it is not revisited).
  - Compute decay: **transit decay = edge travel time × edge average temperature / 10**; **processing decay = neighbor's processing delay if it is a hub, else 0**; **new freshness = current freshness − transit decay − processing decay**.
  - **Pruning:** if the new freshness is **lower than the threshold**, log it (FalkorDB provides a **log function** — for JavaScript developers, think `console.log`) and disregard this frontier; move on to the next edge.
  - Otherwise: push the **edge and node** onto the path (expanding it) and **recurse** from the new frontier.
  - After recursion returns: **backtrack** — pop the frontier (remove both node and edge from the path) — and continue.
- Demo query: match the farm named **`Mountain Orchard`** and the store named **`Downtown Market`** as source/destination, return the farm, the store, and the UDF invocation, with **threshold = 65**:

```cypher
MATCH (farm:Farm {name: 'Mountain Orchard'}), (store:Store {name: 'Downtown Market'})
RETURN farm, store, farmtotable.find freshest path(farm, store, 65)
```

- The UDF returns a **dictionary with a `path` key** (the actual path) and a **`freshness`** value; this query only displays the path.
- Demo output path:
  - Starts at the **Mountain Orchard** farm.
  - First leg: distance **120**, travel time **3 hours**, average temperature **15**, and the leg **is refrigerated**.
  - Wait **3 hours** at **Arctic Cold Storage** [unclear — ASR renders this hub as "Arctic cord storage"/"Altic coal storage"] for processing.
  - Second leg: continue **200 kilometers**, **3 hours**, temperature **2**, refrigerated, to reach the next hub.
  - Third leg: quite short, temperature quite low, reaching the store **Downtown Market**.

### `calculate path cost`

- Registered under the name `calculate path cost`.
- Receives an **array of edges** (the actual path) and computes cost per the delivery cost formula:
  - Total starts at **0**; for every edge, read **distance** and the **`is_refrigerated`** boolean attribute.
  - Edge cost: **$10** if distance ≤ 50; **half the distance** if ≤ 200; **0.4 × distance + 50** if more than 200.
  - Add **20%** if the leg is refrigerated.
  - Accumulate the path cost and return it.

### `generate manifest`

- Purpose: expose the freshest path **plus its cost** as a **JSON-formatted output** ("manifest") for other components of your application to consume; it summarizes the entire delivery path. It can be done in pure Cypher, but it is easier with UDFs and JavaScript.
- `generate manifest` receives the **output of `find freshest path`** (the freshest result) and expects to find the path object/array in it.
- It iterates through the path extracting the **current node and edge**, grouping them into **stops**. A stop contains:
  - the **node name** (probably a hub),
  - the **node type** — a node object exposes its **labels**, and the label is extracted,
  - the **distance** (this lives on the edge),
  - whether the leg was **refrigerated**.
- The **delivery report** contains: a **status**, the **final freshness** (extracted from the freshness result), an **estimated cost** — computed by invoking the **`calculate path cost` UDF from this UDF** (that is why edges were accumulated) — and a **route summary**.
- Demo query: same farm and store; project the farm and store, run `find freshest path`, name the result, and project back the manifest by invoking `generate manifest` on the freshest result; return the manifest. (Run in a terminal window for easier viewing.)
- Demo output:

```text
delivery report
  status: success
  final freshness: 90.44
  estimated cost: 204
route summary
  1. Mountain Orchard (farm) → Arctic Cold Storage [unclear] (hub)   120 km, chilled
  2. Arctic Cold Storage → Air Fry Hub [unclear] (hub)               200 km, chilled
  3. Air Fry Hub → Downtown Market (store)                            50 km, chilled
```

- "That's the end-to-end example of using UDFs to find a farm-to-table freshest path."

## Flex: the FalkorDB UDF library

- **Flex** is FalkorDB's own UDF library: a collection of functionalities **grouped by category** — **string utilities, collections, map, similarity, temporal, and bitwise**.
- Example: docs → collections → **`shuffle`**. Invocation specifies **library `flex` → category `collections` → function `shuffle`** — it expects a **list** and shuffles its elements.
- Flex is intended to be **community-driven**; FalkorDB is happy to accept contributions to extend it.

## Documentation and resources

- Docs are at **docs.falkordb.com**, with a section for UDFs explaining:
  - how to write a UDF,
  - how to load / update / delete UDFs,
  - the supported data types and the capability/functionality of each,
  - the **traversal API**.
- The entire demo is **available online** (link provided in the video); Roy is available on **Discord** for questions.

## Q&A

### Why are UDFs implemented in JavaScript?

- **Security first**: UDFs let users run **arbitrary code/scripts inside the database**, so the platform must be secure — usually meaning **sandboxed** — and JavaScript is the most dominant sandboxing solution.
- Prior experience: the team had worked on this feature at former companies, bringing in engines and trying a bunch of options; the conclusion was that **JavaScript is the best solution in terms of sandboxing, security, performance, and expressibility**.

### Is there an MCP server available?

- **Yes**, one exists. Roy did not have enough detail on hand to expand and said links to the MCP server would be sent afterward; follow-up questions about which server / what it does should be dropped in the comments.

### How are UDFs accessible or manageable in SDKs?

- All FalkorDB functionality is exposed via **commands**: a Cypher query executes the **`GRAPH.QUERY`** command, which can have subcommands — UDFs work the same way.
- UDFs add a new command **`GRAPH.UDF`** with subcommands: **`UDF LOAD`**, **`UDF LIST`**, **`UDF REMOVE`**, and **`GRAPH.UDF FLUSH`**.
- Users normally do not send commands manually: all official clients expose UDF functionality (the Python client was used in the demo) — use the client's UDF functions to **list, load, replace, and delete** UDFs.
- Like graph data, UDFs are **replicated and persisted**: loading a UDF to one node in a cluster replicates it; a persistency/backup file also includes UDFs, and restoring a database from backup restores all UDFs.

### If I have a hosted cloud account with FalkorDB, is Flex already on my instance?

- **No.** UDFs are quite new, so you must run the **latest version** of FalkorDB on the cloud to have all UDF capabilities.
- FalkorDB deliberately does **not bundle Flex** with the database: you **download the `flex.js` script** (published in the Flex GitHub repository) and run **`GRAPH.UDF LOAD flex`** — or use one of the clients to load it. From that point it persists; you can then use any utility in Flex, but you must load it manually.

### Are UDFs replicated and persistent?

- **Yes** — yes and yes. (Asked separately, same answer as above.)

### Can I use this in Python?

- You can **interact with UDFs via Python** — queries, loading UDFs, and everything else can be done in any client language FalkorDB supports, including Python.
- You **cannot write UDFs in Python**: the engine that runs the functions is a **JavaScript engine**, so UDFs must be written in JavaScript.

### If there are multiple graphs in the same cluster, are UDFs available on all of them?

- **Yes.** This was a deliberate design decision: UDFs are **cross-graph**, not associated with a single individual graph. Once a UDF library is loaded it is available **throughout the entire cluster for every graph**.
- Rationale: users managing **hundreds or thousands of graphs** would otherwise have had to load the same UDFs over and over for each graph.
- Currently the design is: UDFs are available cluster-wide to every graph managed in the cluster.

### Why is there no TypeScript support?

- Roy does not object to it — the restriction comes from the engine: UDFs run on **QuickJS**, which (to the best of his knowledge) does not support TypeScript. If a version gains TypeScript support, it should come out of the box.

### How big can a UDF get, and can I store data inside it?

- **Yes, you can store data within a UDF** — for the most part, everything you can do with plain vanilla JavaScript you can do in a UDFs. It is not running in a browser, so there are some restrictions.
- There is **no restriction on the size of a UDF script**.
- What is restricted: the **execution time of a single UDF call** and the **size of the stack / amount of memory a single UDF can consume** — safety mechanisms so an abusive UDF cannot make the database unresponsive or otherwise affect it.

### What are the limitations of UDFs or Flex?

- Besides the memory-consumption and execution-time caps: the feature is relatively new.
- The **log function** and **traversal functionality** were added; a broad set of graph-interaction functionality is not there yet.
- **UDFs cannot perform any write operation.** They can read and access any data in your graph — nodes, edges, attributes, relationship types, labels — but cannot create or delete nodes, create or delete edges, or update attributes. Every write operation is currently impossible via UDFs.

### Do UDFs improve performance compared to regular methods?

- Dan: yes — covered when calculating the freshness of the farm-to-table demo (around minute 20 of the video).
- Roy: it depends on the use case and the query. **UDFs have overhead:**
  - converting data from FalkorDB's built-in type system into JavaScript (pushing arguments from Cypher to JS),
  - the reverse conversion when returning data from the UDF (JavaScript → FalkorDB native types),
  - QuickJS runs JavaScript in an **interpreted manner**, so it is not as fast as plain Cypher (which goes through many optimizations and is written to be highly performant).
- But in situations like the demo, UDFs **open a new avenue** (pruning, custom traversal) that translates to better performance. Some cases are faster; others may be a bit slower.

### Are you considering Rust-based UDFs in the future?

- "Never say never," but **not on the roadmap** at the moment. The JavaScript version was just released, and the team does not think it would spend time introducing Rust as a UDF engine right now.

### How do FalkorDB UDFs compare to Neo4j's?

- FalkorDB started the UDF feature to bridge situations where users request functionality that would take too long to implement or does not make sense to implement natively, so they can still have custom functionality.
- Neo4j did the same years ago with their custom-logic capability, introducing **APOC** (the Neo4j analogue of Flex; ASR renders it "epoch").
- **Neo4j UDFs are written in Java**: you compile a **jar**, upload the jar — more tedious. In FalkorDB it is just a **JavaScript script** to upload; you can remove it when unneeded or easily update it. There is **no compiling**, and you don't send files to be picked up from a specific directory by the server.
- The FalkorDB implementation is much easier; over time **Flex should reach a wide coverage similar to APOC**, hopefully with community help.

### Community contribution encouragement

- FalkorDB is open for contributions; Dan encourages viewers to try UDFs, take a look, and contribute. (Dan also notes the session hit exactly one hour; remaining chat questions will be answered offline and distributed via email, blog, Discord, and the usual channels, together with the VOD.)

## Key facts and numbers

- UDFs are a **recently added** FalkorDB feature at recording time; the concept has existed in databases for a long time.
- JavaScript is the UDF language; the engine is **QuickJS** (interpreted; no TypeScript support known at recording).
- Example library: **`collection utils`** with functions **`intersect`, `union`, `shuffle`, `zip`**.
- Demo library **`farm to table`** with functions **`find freshest path`, `calculate path cost`, `generate manifest`** (one JavaScript file each, bundled by a Python script).
- Graph model: node types **farm / hub / store**; one edge type **connected**; three farms in the demo graph.
- Edge metadata: **travel time** and **average temperature**; hub metadata: **processing delay**.
- Freshness: starts at **100**; decay = **travel time × average temperature / 10** per leg + hub **processing delay**; slide example result **73.7**.
- Pruning threshold examples: **60%** (spoken example) and **65** (demo query).
- Demo entities: farm **`Mountain Orchard`** (also transcribed "Mountain Orchid"), store **`Downtown Market`**, hubs **Arctic Cold Storage** [unclear ASR] and **Air Fry Hub** [unclear ASR].
- Demo route: leg 1 — **120** distance, **3 hours**, temperature **15**, refrigerated; hub wait **3 hours**; leg 2 — **200 km**, **3 hours**, temperature **2**, refrigerated; leg 3 — short, low temperature. Manifest distances: **120 / 200 / 50 km**, all legs **chilled**.
- Manifest output: status **success**, final freshness **90.44**, estimated cost **204**.
- Cost formula: **$10** (≤ 50) / **half distance** (≤ 200) / **0.4 × distance + 50** (> 200); **+20%** if refrigerated.
- Commands: **`GRAPH.QUERY`**, **`GRAPH.UDF LOAD / LIST / REMOVE / FLUSH`**.
- Flex categories: **string utilities, collections, map, similarity, temporal, bitwise**; load manually via `flex.js` from the Flex GitHub repo with `GRAPH.UDF LOAD flex`.
- No UDF script-size limit; capped **execution time per UDF call** and **stack/memory per UDF**; **no write operations** allowed.
- UDFs are **cross-graph**, **cluster-replicated**, and **included in backups/persistence**.
- Docs at **docs.falkordb.com** (UDF section); series: Graph and RAG talks, monthly; this session ran **1 hour**; next session would be the **12th in the series**.

## Code, commands and queries

Formulas (as described):

```text
freshness = 100 − Σ legs (travel_time × average_temperature / 10) − Σ hubs (processing_delay)
```

```text
per leg:  distance ≤ 50        → cost = 10
          distance ≤ 200       → cost = distance / 2
          distance > 200       → cost = 0.4 × distance + 50
          refrigerated leg     → cost = cost × 1.2   (+20%)
```

Registering a UDF for exposure in Cypher (via the global `falkor` object):

```javascript
falkor.register("find freshest path", findFreshestPath);
// The exposed name is the first argument; it need not match the function name.
```

Managing UDFs (commands referenced in Q&A):

```text
GRAPH.QUERY <graph> <cypher>          # normal Cypher execution (UDFs invoked inside queries)
GRAPH.UDF LOAD <library_name> <content>
GRAPH.UDF LIST
GRAPH.UDF REMOVE <library_name>
GRAPH.UDF FLUSH
GRAPH.UDF LOAD flex                   # load the community Flex library (flex.js from GitHub)
```

Invoking UDFs from Cypher — pattern `library.function name(args)`:

```cypher
MATCH (farm:Farm {name: 'Mountain Orchard'}), (store:Store {name: 'Downtown Market'})
RETURN farm, store, farmtotable.find freshest path(farm, store, 65)
```

```cypher
// generate manifest demo shape (as described): run find freshest path, then
// feed its result into generate manifest and return the manifest
MATCH (farm:Farm {name: 'Mountain Orchard'}), (store:Store {name: 'Downtown Market'})
WITH farm, store, farmtotable.find freshest path(farm, store, 65) AS freshest
RETURN farmtotable.generate manifest(freshest)
```

```cypher
// flex invocation example: library → category → function
RETURN flex.collections.shuffle(list)
```

Loading pattern (as described in the demo): read each JavaScript file, concatenate into one string, then load with the client's UDF-load function specifying the **library name** and **content** (Python was used).

## Hackathon relevance

- **Push scoring logic into the context layer:** the freshness-decay pattern is a template for agent-memory ranking — store a freshness/confidence score on edges, let a UDF compute decay per hop, and prune low-value paths instead of retrieving everything and filtering in app code.
- **UDFs call UDFs and return JSON manifests:** a `generate manifest`-style UDF can shape graph results into structured JSON ready for an LLM prompt — a clean pattern for the "company brain" track.
- **Safe by default:** UDFs are read-only with per-call time/memory caps, so agent-generated or user-contributed scoring functions cannot write to or hang the graph.
- **Library scope matters for multi-agent setups:** one UDF library is shared across every graph in the cluster — load once, use in every agent's graph.
- **Flex as ready-made tooling:** collections, similarity, temporal, and string utilities can be loaded in one command when building agent tooling without writing custom JavaScript.

## Related notes

- [`transcript-cyber-security.md`](transcript-cyber-security.md) — another FalkorDB webinar showing custom traversal logic pushed into the database (see its suggested cross-link back to this note).
- [`docs-cypher-reference.md`](docs-cypher-reference.md) — the Cypher surface on which UDF invocations and `GRAPH.*` commands sit.
- [`../../guide/06-writing-good-cypher.md`](../../guide/06-writing-good-cypher.md) — guidance for the Cypher query that wraps UDF calls.
- [`../../guide/04-cypher-basics.md`](../../guide/04-cypher-basics.md) — Cypher fundamentals needed before the UDF invocation pattern makes sense.

## Logistics

- Links and documentation were promised in the video description; the full demo is available online.
- Q&A questions not covered live would be answered afterward and published in the blog (all free, available within 24 hours of the session).
- Roy is reachable on Discord; Dan encourages joining the Discord community to post questions and share projects; contributions reach the team via the website and Discord.
- The team runs monthly workshops; subscribing to the Luma event directory gets early invitations. The next "Graph and RAG talk" session would be the 12th in the series.
