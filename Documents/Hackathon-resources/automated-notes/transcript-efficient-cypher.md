# Writing Efficient Cypher Queries — FalkorDB Workshop

> **Source:** [`Transcript copy 18.txt`](../Transcript%20copy%2018.txt) · **Type:** webinar transcript · **Saved:** Oct 16, 2026 · **Original URL:** https://www.youtube.com/watch?v=emUQmEitSGY

## Overview

- FalkorDB workshop on writing efficient Cypher: what the planner does, how to read `EXPLAIN`/`PROFILE` output, and how to push queries toward **low latency, high throughput, and a low memory footprint**.
- Works through three concrete questions against a flight graph (passengers, flights, airports; ~3M nodes and 5.5M edges): counting airports, finding flights between two cities, and checking reachability to Heathrow with a variable-length traversal.
- Every query variation is benchmarked (latency + QPS) on the presenter's development machine, so the impact of each optimization is visible: `count(a)` vs `count(1)`, a barrier clause, index seeks, exploiting data-model guarantees, parameters, and returning only needed fields.
- Ends with Q&A: index creation is asynchronous, labels vs properties for multi-tenancy, the exact size of the demo database, and how much of the advice carries over to other Cypher vendors.
- Assumes the audience is at least somewhat familiar with Cypher or graph databases; the companion guide module distills the same session into rules of thumb.

## The goal: latency, throughput, memory

- Everyone wants their queries to run as fast as they can (**low latency**), to process as many queries as they can (**high throughput**), and to do it all with a **low memory footprint** — whether the database is a graph, relational, or document store.
- This is challenging both in terms of the database author and from the user's perspective — this is where **query optimization** kicks in.
- To achieve the performance you're after, you have to dig deeper: understand what actually affects performance, what can be tuned, and how.

## How FalkorDB plans and profiles queries

- **Planner**: a specific component within the database responsible for transforming a query (a Cypher query here) into an **execution plan** — the set of operations the database is going to have to run in order to compute the answer you're looking for.
- An execution plan is a **tree of operations**. Think of the operations as building blocks that can be composed in different ways, each responsible for accomplishing a single task.
- **Data flows through the plan**: one operation passes a record (a container of data) to the next; the records that end up at the very end of the plan are returned to the user as the final result set.
- Planners are not perfect: they make mistakes, or don't have enough information to produce an efficient plan. There can also be **multiple different plans** for a given query — all able to produce the same result, but with different performance characteristics.
- Two utilities for reasoning about execution plans:
  - **`EXPLAIN`** — gives the execution plan for a query **without actually running the query**; usually used to review the plan.
  - **`PROFILE`** — the more powerful analytical utility: it not only gives the plan but runs and profiles the query. The profile includes, for **every operation**, the **number of records it produced** and **how much time overall** the database spent executing it. (A slide shows an example profile for three operations with their profiling information.)
- Execution plans are read **bottom-up**: the first operation is at the bottom of the plan.
- Session Q&A: the displayed times are **real measurements**, not estimates from the planner — "information collected as the query was running".

## Data model: passengers, flights, airports

- Three entity types: **passengers**, **flights**, **airports**.
- Relations: a passenger boards a flight; a flight arrives at an airport; a flight departs from an airport.
- Graph ID used in the demos: `flights`.
- Size (given in Q&A): **almost 3 million nodes** and **5.5 million edges**.
- All timings below come from the presenter's development machine. The dataset is not big enough for all the changes to show real impact; with huge datasets the team's expectation is that the improvements would be greater.

## Query 1: how many airports? — `count(1)` vs `count(a)`

- The demo runs `graph.profile`, providing the graph ID (`flights`) followed by the Cypher query: match a node with the label `airport` and count one for every encountered airport.
- Plan, straight and simple (read bottom-up):
  - **Node by label scan** — scans through every node of a specific label; here all airport nodes. It produced just over **10,000 records** (meaning more than 10,000 airport nodes), and the database spent **18 ms** doing it.
  - An **aggregation** operation performing the count.
  - Then the results.
- The database can actually do better, and it's not obvious how — it has to do with the semantics of aggregation:

```cypher
MATCH (a:airport)
RETURN count(1)
```

```cypher
MATCH (a:airport)
RETURN count(a)
```

- The only change: instead of `RETURN count(1)`, write `RETURN count(a)`. The fine line to understand: `count` **evaluates the value** `a`, and in case it is **null**, the count is not increased.
- Seeing this, the planner produced a more efficient plan that does not count at all — it just brings up some **internal statistics** and reads those out.
- Result: **less than 1 millisecond**, compared with **around 36 milliseconds** for the previous version — a huge difference for a small modification.
- Lesson: if a result doesn't seem reasonable (a simple count taking ~36 ms), inspect the execution plan; when you see work that doesn't make sense, be on the lookout for optimizations.

## Query 2: which flights go from Salt Lake City to Washington?

- The baseline query is a graph traversal: start at an airport (`s`), look for departing flights, require the flight to arrive at another airport (`t`), a clause says `s` must be Salt Lake City and `t` must be Washington, and the query returns the flights connecting those airports.
- Baseline plan:
  - **Node by label scan** over all airports, searching for Salt Lake City (this scan appears on line 7 of the plan).
  - A **filter** filtering out all airports but Salt Lake City — one was found after roughly **40 ms**.
  - Traverse from S to find all departing flights; for every flight, check where it lands (the target airport) and whether that target is Washington; if yes, return the flight.
- Baseline metrics: **mean latency 13.7 ms** and **throughput of roughly 120 QPS** (queries per second). This is the baseline that the rest of the talk improves on.

### Optimization 1 — find S and T only once (barrier clause)

- Idea: find S (Salt Lake City) and T (Washington) **before starting to traverse**. The clause acts as a **barrier** for the planner, telling it "you must find S and T before you travel" — so when the traversal `MATCH` is reached, the values of S and T are already **bound**.
- New plan: find T (Washington) by a full **node scan** with a filter; find Salt Lake City with another **node by label scan**; the two are disjoint at that point in time, so they are combined using a **Cartesian product**; then the planner expands from S to its departing flights.
- The important change: **`expand into`** — a conditional traverse that occurs when traversing between two nodes that are **already bounded**. It just checks whether an edge exists between those two, which is cheaper than a full traversal. The new variation only checks for an edge connecting the currently discovered flight to the already-bound Washington; it doesn't even check that Washington was reached.
- Numbers: `expand into` was evaluated in just **54 ms** (in the previous version roughly **40–54 ms** went into the filter), but the extra conditional traverse was removed completely — **121 ms** of work gone.
- Updated metrics: **median latency dropped from 13 ms to 5 ms**, and **throughput rose by 11 QPS**. A nice speed-up — "nothing too fancy".

### Optimization 2 — create indexes on the attributes you filter on

- If you filter on an attribute, create an **index** on it: replace **node by label scan + filter** with an **index seek**.
- Finding S and T became extremely fast — just consulting the index — dropping **well below 1 ms**.
- Updated metrics: **minimum latency improved by another 1 ms**; **median latency also dropped**; throughput didn't really change (maybe some degradation). The presenter notes this is the dev machine and the dataset isn't big enough for the change to show real impact — on huge datasets the improvement would presumably be greater.
- Still: don't be discouraged from creating indexes when you know they are needed.

### Optimization 3 — exploit the data model (drop the redundant label check)

- Data-model guarantee: when traversing from Salt Lake through a **departure edge**, it is guaranteed that the edge resolves in a **flight node** — a guarantee the user must enforce.
- If that holds, the `:flight` label on the traversed node can be **removed**; the database no longer does extra work validating that the edge resulted in a flight-labeled node.
- There's no visible change in the plan (still going from S to F), just no extra validation effort.
- Updated metrics: **max latency dropped by 5 ms**, **average latency dropped by 1 ms**, and **throughput increased**.

### Optimization 4 — use parameters for scalars

- Scalars like `'Salt Lake City'` or `'Washington DC'` should be introduced in the form of **parameters**.
- Think of your query as a **template** that can be reused over and over again under a different set of parameters.
- Benefit: you better utilize the database's **internal caching system**. Not the result that gets cached — but processes happening within the database, such as **query validation** and **execution-plan construction** (at least some parts), can be reused and skipped because the specific template was already seen and processed. All that's left is to evaluate the parameters.
- It didn't make a huge difference on performance in the demo, but it is an important feature to take advantage of.

### Optimization 5 — return only what you need

- The original query returned the **entire flight node**. Depending on the application, that may be reasonable — but assume the application only cares about the **flight number**.
- Returning exactly what is needed:
  - reduces **network overhead**,
  - skips some extra steps happening within the database,
  - and usually reduces **memory** as well.
- Updated metrics: a **huge jump**, specifically in throughput.
- This doesn't just affect the database side; it affects the **client** too. The metrics were measured with **FalkorDB's Python client**, which has to prepare the Python version of whatever is returned — a scalar (string or number), an array, a node object, or an edge object. Returning an integer instead of a node removes a lot of heavy lifting and extra processing from the client-passing logic.

### Query 2 results summary (as reported on the dev machine)

| Variation | Latency | Throughput |
| --- | --- | --- |
| Baseline (trivial query) | mean 13.7 ms | ~120 QPS |
| Find S & T first (barrier) | median 13 → 5 ms | +11 QPS |
| + index on filtered attribute | min latency −1 ms; median down further | ~unchanged (maybe slight degradation) |
| + drop `:flight` label check | max latency −5 ms; average −1 ms | increased |
| + parameters | no huge difference | — |
| + return flight number only | huge improvement | huge jump |

## Mid-session Q&A

### Are the displayed times real measurements or planner estimates?

- Real measurements, done at one time — these are **not estimations**; this is information collected as the query was running.

### How long does creating an index normally take?

- It depends: on the **type of values** being indexed and on **how much data** is being indexed. There is no number that says "indexing one string takes X".
- What can be said: **index creation is an asynchronous process**. You can start out without an index (as in the demo — the graph was already constructed and queried, then the team decided to create an index to improve performance).
- Issuing the create-index command kicks off an asynchronous background procedure for populating the index. **While the index is being constructed you can continue querying your graph and making modifications to it.**

### Multi-tenancy: labels or properties to distinguish tenants?

- The presenter first asks for elaboration on what is meant by multi-tenancy, then answers the general data-modeling question: **whatever feels natural**.
- When deciding between **labels** and **attributes** for something like `passenger` or `flight`, remember the value of creating a label: you double down on the fact that you have a real **entity**.
  - You can quickly filter out all nodes with a given label.
  - You can create **constraints** against a specific label.
  - You can create an **index** indexing a label.
  - These constructs are within the resolution of a label — unlike attributes.
- When you conceive your data as a graph, the first impression of how things are laid out, how they are connected, and which attributes belong to which entity is usually the **natural** one — go with it.

### What is the size of the database (nodes/relations) and the timings computed on it?

- **Almost 3 million nodes** and **5.5 million edges**.
- The "timings" part of the question wasn't understood at the time; the presenter asked for it to be repeated and said they would clarify/revisit it later — [no follow-up answer appears in the transcript].

## Query 3: connectivity/reachability — can the passenger reach Heathrow?

- Scenario: a passenger boarded flights one and two, and those flights landed at specific airports. We want to know whether, from each airport he visited, there is a path — a direct flight or a **two-leg trip** — to **Heathrow (HRO)** in the UK.
- The query: a **variable-length traversal** starting from the passenger with a **minimum length of 4** and a **maximum length of 6** hops.
- Why 4–6:
  - passenger → flight = **1 hop**,
  - flight → airport = **2**,
  - departure from that airport = **3**,
  - landing at Heathrow = **4**.
  - A **second leg** is allowed in case Heathrow isn't reached: an extra departure and arrival = **+2 hops**, for a maximum of **6**.
- The planner's problem: both ends of the traversal look equally promising. The starting point (the passenger) has a label **and** a filter; the other end (airport HRO) also has a label and a filter. So there is a **tie** — no clearly more beneficial entry point to start expanding from. This is where user knowledge of the data should help the planner pick the direction that **narrows the search space**.
- Heathrow is a huge hub: if you expand from HRO, the **fan-out** (number of reachable nodes) is very big, and from there you expand further, so the search space before arriving at our passenger is huge. The passenger's fan-out is relatively much smaller — not too many nodes or flights the passenger could have boarded.
- Binary-tree analogy (each node has exactly two children): to find the path connecting the root to some leaf, starting at the root and going down (e.g., depth-first always to the right) can visit **every single edge in the tree** before reaching the target leaf. Reverse the search — start at the leaf and traverse **upwards** toward the root — and it's just a handful of edges: the depth (height) of the tree. This is exactly what happens in the two variations below.

### The disaster plan — forcing the traversal to start at Heathrow

- A variation uses a barrier clause to force the planner to start from HRO: HRO must be found before the variable-length traversal runs.
- Results: quickly after HRO was found, the expansion produced **half a billion results** and took about **900 seconds** to compute.
- Each of those half a billion reachable nodes then had to be evaluated to see whether it is our passenger — **another 630 seconds** — just to learn that, for many of the airports the passenger visited, HRO is **not reachable**.
- Root to leaf, as in the tree analogy.

### The winning plan — traverse from the passenger

- Start at the passenger (found with an **index scan**) and run the variable-length traversal toward HRO.
- The traversal found nothing (the destination is not reachable) and took **less than 1 millisecond**.
- The **entire query took less than 1 ms**, compared with **minutes** for the other variation.

## Final Q&A

### Optimizing filters on patterns (e.g., "is A a friend of B?")

- These are really two different ideas: applying **filters**, and checking whether a node has a **friend relationship** with another node.
- Example filter from the talk (numbers as heard):

```cypher
MATCH (p:Person)-[:friend]->(z:Person)
WHERE p.age > 30 AND p.height > 1 AND z.score > 90
```

- Applying filters takes time. What happens: the filters are constructed into **one big tree** capturing the different filters, and then the tree is **broken down into its smallest components**. With `AND`, each sub-filter (e.g., `p.height > 1`) can be split out and evaluated individually; with `OR` you cannot break the filter into sub-filters because of the OR semantics. [The transcript's ASR renders the component example as `p.height > 32` — unclear.]
- The planner's responsibility is then to **position those filters at the earliest point in time** where they can be evaluated — e.g., the filter for Salt Lake City is applied right after the S node is available; the filter for Washington right after the T node is available.
- If an **index** is available, the planner tries to convert a filter **into an index**.
- Filters that were not converted to an index are **rejoined/recompacted**, so you don't see a filter followed by another filter.
- Further optimization: because the tree has a left and a right side, for an `AND` the planner can evaluate the **cheapest** part first — e.g., getting the edge is cheaper than getting the height — and if that sub-branch is false, the entire expression is false and it can move on.
- Friend relationships — a part that is **pretty unique to FalkorDB**:
  - Whenever you create a relationship type (say, `friend`), FalkorDB manages a **sparse matrix for each relationship type**.
  - Node `i` is associated with row `i` of the matrix; node `j` is represented by column `j`.
  - To know whether there is a friend relationship between `i` and `j`, inspect the entry `(i, j)`: if the entry exists, it contains the **edge ID** (e.g., edge ID `4`); if there is no relationship between `i` and `z` (column Z), the entry is **missing** from the matrix.
  - This is exactly what the **`expand into`** operation does — it inspects the corresponding row and column — **unlike conditional traversals, which perform matrix × matrix multiplication**.

### Are these efficient query patterns FalkorDB-only, or applicable to other graph databases?

- Most of what was covered is applicable to **most other vendors that support Cypher**.
- Cypher (openCypher) is kind of standardized — but it's the **operations that are not standardized**. Each database comes with its own planner and its own set of building blocks; you'd see similarity between FalkorDB's operations and other vendors', and occasionally a proprietary operation that takes advantage of a database's internals.
- Analogy: **x86 vs ARM** — the same C code can be compiled to different architectures. x86 has a rich set of operations; ARM has a narrow set of simple building blocks, and it's the **simplicity and composition** of them that yields performance.
- Suggestions that travel well: use templates (parameters), think about the **guarantees** you're getting from your data modeling, and create indexes.
- Housekeeping: much of the discussion happens on **Discord**; questions submitted in the Zoom Q&A were collated and answered individually over email after the session.

## Key facts and numbers

- Demo flight graph (`flights`): **almost 3M nodes**, **5.5M edges**; presenter's development machine.
- Airports in the graph: just over **10,000** airport nodes.
- `count(1)` query: **18 ms** for the label scan, ~**36 ms** total; rewritten with `count(a)`: **<1 ms**.
- Baseline SLC→Washington: **mean latency 13.7 ms**, **~120 QPS**.
- Barrier optimization: `expand into` evaluated in **54 ms**; previous filter work ~**40–54 ms**; **121 ms** removed; **median 13 → 5 ms**; throughput **+11 QPS**.
- Index optimization: S/T lookup **well below 1 ms**; minimum latency **−1 ms**; median down; throughput ~flat (maybe slight degradation).
- Label-check removal: max latency **−5 ms**; average latency **−1 ms**; throughput increased.
- Parameters: no huge difference, but valuable (plan/validation caching).
- Return flight number only: huge jump, especially throughput (Python client prepares scalars/nodes/edges).
- Reachability query: **min 4 / max 6 hops**; disaster variation: **half a billion** results, ~**900 s** + ~**630 s**; winning variation: **<1 ms** (vs minutes).
- Filter example numbers: `age > 30`, `height > 1`, `score > 90`; matrix lookup edge-ID example: **4**.
- Index creation is **asynchronous** — no fixed duration; it depends on value types and data volume.
- Next workshop: **March 18**, "building your first knowledge graph"; recording of this session: **~48 hours**.

## Code, commands and queries

The talk showed its queries on screen; this transcript is ASR text, so exact syntax is not preserved. The fragments and sketches below follow what was described, with product names normalized.

- Profiling utilities: `EXPLAIN` (plan only) and `PROFILE` (runs + profiles; per-operation record count and time). Demo invocation: `graph.profile` with the graph ID `flights` and the Cypher query.
- Counting airports — the one-token optimization:

```cypher
MATCH (a:airport)
RETURN count(1)
```

```cypher
MATCH (a:airport)
RETURN count(a)
```

- Salt Lake City → Washington with the barrier clause (shape as described; relationship names are not preserved by the ASR):

```cypher
MATCH (s:airport {name: 'Salt Lake City'}), (t:airport {name: 'Washington'})
WITH s, t
MATCH (s)-[:departure]->(f:flight)-[:arrival]->(t)
RETURN f
```

- Index seek: create an index on the attribute you filter on (e.g., the airport name) — the plan changes from "node by label scan + filter" to "index seek"; lookups drop to well below 1 ms.
- Return only the needed field (e.g., the flight number) instead of the whole node — less network overhead, less client processing.
- Reachability: a variable-length traversal with **minimum length 4 / maximum length 6**, starting from the passenger toward HRO (as described; demo found no reachable path).
- Plan operations to recognize: **node by label scan**, **filter**, **expand into** (conditional traverse), **Cartesian product**, **index seek**, **aggregation**, **variable-length traversal**.
- Query parameters: scalars passed as parameters so the query template (validation + plan construction) can be cached and reused.

## Hackathon relevance

- Profile before optimizing: agent context-layer queries are on the hot path, and `EXPLAIN`/`PROFILE` show exactly which step to fix.
- Bind both endpoints before a traversal and index what you filter — keeps multi-hop lookups ("how is X connected to Y?") fast as the graph grows.
- Return only what the agent needs (IDs, names, scores) — smaller payloads and less client processing per LLM turn.
- Use parameters for reusable query templates — the same traversal shape per tool call, different values each time; plan-cache reuse matters in an agent loop.
- Model your context graph so edge types imply node types (guarantees) — fewer validation steps per hop.
- Reachability direction matters: expand from the small side of the pattern (the passenger, not the hub) to avoid search-space explosions.

## Related notes

- `docs-cypher-reference.md` — the Cypher surface these optimizations apply to.
- `transcript-efficient-cypher-copy-6-dup.md` — duplicate transcript of this same workshop (the two saved files are byte-identical).
- `../../guide/06-writing-good-cypher.md` — the guide's distillation of this session: plan first, barrier, index, UDFs.

## Logistics

- Questions raised in the Zoom Q&A were collected and answered individually over email after the session; much of the community discussion happens on **Discord**.
- The team is starting a **cadence of hands-on workshops** — some live coding, some getting-started, some theory.
- The **next workshop is on March 18**, about **building your first knowledge graph**; attendees of this session get an invite before it goes out to everyone else.
- The **recording** of this session will be made available, probably within **48 hours**, on social media, Discord, and similar channels.
