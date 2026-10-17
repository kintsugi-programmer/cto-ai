# Graph Hacks: Context for AI Agents (WeMakeDevs hackathon, powered by FalkorDB)

> **Source:** [`Graph Hacks_ Context for AI Agents _ WeMakeDevs.mhtml`](../Graph%20Hacks_%20Context%20for%20AI%20Agents%20_%20WeMakeDevs.mhtml) · **Type:** event page · **Saved:** Oct 16, 2026 · **Original URL:** https://www.wemakedevs.org/hackathons/falkordb

## Overview

- Online hackathon hosted on **WeMakeDevs** and **powered by FalkorDB**: "Build a working agent, or a group of agents, with FalkorDB as its context layer. The graph has to shape what the agent does, not sit on the side."
- Theme: "Agents are only as good as the context they work with. Give yours a graph: connected data it can reason over, a memory it keeps between sessions, and a clear picture of how things relate. Build an agent that makes decisions you can trace."
- Runs **Oct 15, 12:01 AM → Oct 18, 11:59 PM GMT+5:30 (IST)**, online from anywhere, free, solo or teams of up to 4 people; **$20,000** total prize pool across **3 tracks** + 2 side prizes.
- Page tabs: **Overview, Schedule, Rules, Resources** plus a **Submit your project** button. Discord is the official support channel for the whole event.
- This saved copy is the logged-in participant view: team **cto-ai**, team code **25F934**, **1 of 4 seats filled** by Siddhant Bali (@kintsugiprogrammer, Leader), and the countdown "Ends in 2 days, 20 hours" with submissions opening **17 Oct 2026, 01:03**.

## Event facts (header)

- **When:** Oct 15, 12:01 AM to Oct 18, 11:59 PM GMT+5:30 (= IST).
- **Where:** Online, from anywhere.
- **Teams:** Solo or up to 4 people.
- **Prizes:** $20,000 in total.
- **Registered:** 7,345.
- **Team code:** 25F934 (with an "Explain the team code" tooltip control next to it).
- **Countdown at capture:** "Ends in 2 days, 20 hours".

## Team panel (as captured)

- Team name: **cto-ai** — "1 of 4 seats filled."
- Member listed: **Siddhant Bali (you)** — @kintsugiprogrammer — **Leader**.
- Controls: **Invite by email** / **Invite** / **Delete team**.
- Notice: "Submissions open 17 Oct 2026, 01:03. You cannot change your team after you submit your project."
- "Looking for a team, or stuck on a graph model? The FalkorDB Discord is open for the whole event." → `https://discord.com/invite/Y2mMT9VdMy`.

## 01 / The challenge — Give your agent the context to act

- **The problem:** "Agents see pieces, not the whole picture. They lose track of what happened in earlier sessions, miss how people, systems, and records relate, and can't explain why they made a choice."
- **The shift:** "Put the agent's context in a graph. Data, memory, and company knowledge become nodes and edges the agent can follow, so it works from real relationships instead of guessing."
- **The brief:** "Build an agent that acts on connected data, remembers what it learns, and can show how it got to each answer."
- **Work the graph has to do** (5 listed capabilities):
  - Follow connections across data
  - Remember across sessions
  - Share state between agents
  - Connect people, projects, and decisions
  - Show the path behind an answer
- **Entry rules at a glance:**
  - **One agent problem** — "Pick a task where the answer depends on how things connect, and build the agent that handles it."
  - **Solo or a team of four** — "Enter on your own or with up to three others. Register once, either way."
  - **Open worldwide** — "Free to enter, online from anywhere, and no graph database experience needed."
  - **Three tracks** — "Agents that act on connected data, agent memory and coordination, or company brain. Enter the one your idea fits."

## 02 / Tracks — Three tracks

- "Build for one, or for all three at once. Each track has its own prize."

### Track 01 — Agents That Act on Connected Data (🕵️)

- "Build an agent that uses the graph to decide and act. It could investigate fraud, triage security findings, or work through a codebase."
- **Key focus:**
  - Multi-hop reasoning
  - Graph queries and algorithms as agent tools
  - Tool selection through MCP
  - Actions based on what the graph shows
  - Explainable results

### Track 02 — Agent Memory and Coordination (🤖)

- "Build agents that remember across sessions and share state with each other. Memory should persist, update over time, and be available to every agent that needs it."
- **Key focus:**
  - Episodic, semantic, and procedural memory
  - Persistent conversation history
  - Shared state and handoffs between agents
  - High-concurrency reads and writes
  - Separate memory per user or tenant

### Track 03 — Company Brain (🧠)

- "Build an agent that understands how a company works. Connect people, teams, projects, documents, and decisions in one graph, so the agent can answer questions and get work done across all of it."
- **Key focus:**
  - Knowledge from docs, tickets, and chats in one graph
  - Who owns what, and who knows what
  - Tracing decisions back to their source
  - Keeping knowledge current as things change
  - Answers with clear sources

## Prize pool — $20,000

- "One prize for each track, plus two side prizes. Every member of a winning team gets the prize."
- **Agents That Act on Connected Data:** **iPhone 18 Pro** — "For the best agent that uses a graph to make decisions and take action."
- **Agent Memory and Coordination:** **PS5 with GTA VI** — "For the best agents that remember across sessions and share what they know."
- **Company Brain:** **M6 Mac Mini** — "For the best agent that understands how a company works and gets work done."
- **Side prize — Best blog post:** **AirPods 5** (1 winner) — "Write a blog post about your project. The best post wins a pair of AirPods 5."
- **Side prize — Top 50 submissions:** **T-shirt** (top 50 projects) — "Every member of the top 50 teams gets a t-shirt, shipped to their address."

## 03 / Why graphs — Agent questions are about connections

- "The hard questions agents get asked don't live in one record. The answer depends on how several things relate."
  - 01 — Which accounts are linked to this flagged transaction?
  - 02 — What did this customer ask for last month, and was it resolved?
  - 03 — Who on the team has worked on this system before?
  - 04 — What breaks if this service goes down?
- "A graph database stores those relationships directly, so the agent can follow them in one query instead of stitching records together on every step."

## 04 / About the sponsor — Powered by FalkorDB

- "An open-source graph database built for AI agents."
- "Traversals are fast enough to run on every step of an agent loop, and one instance can hold thousands of isolated graphs, so each user, agent, or tenant gets its own. Run it locally with Docker."
- **Official clients:** Python, Node.js, Java, Rust, Go, PHP, C#.
- **Get started in one line:** `$ docker pull falkordb/falkordb:latest` → `https://docs.falkordb.com/`.
- Capability blurbs:
  - **Context for AI agents** — "A graph your agent can read and write on every step, and still find on the next session." (Agent memory · Multi-agent state · Connected company knowledge)
  - **Connect your agent stack** — "Use FalkorDB through the framework or protocol you already build with." (GraphRAG-SDK · QueryWeaver · MCP · Graphiti · Cognee · LangChain · LlamaIndex)
  - **One graph per user or tenant** — "Leverage multigraph topology to create isolated graphs in a single instance, without running separate deployments."
  - **Query with Cypher** — "Create nodes and relationships, match patterns, follow paths, and return what your agent needs." → `https://docs.falkordb.com/cypher`
  - **Graph algorithms as agent tools** — "Traversals your agent can call instead of writing them itself." (Shortest path · PageRank · Centrality · Connected components · Community detection) → `https://docs.falkordb.com/algorithms`
  - **Explore the graph** — "Use FalkorDB Browser to run queries, inspect the data model, and see how records connect."

### Cypher example — "who knows about this system"

```cypher
MATCH (p:Person)-[:WORKED_ON]->(:Project)-[:USES]->(s:System {name: $system})
RETURN p.name AS person, count(*) AS projects
ORDER BY projects DESC
LIMIT 5
```

## 05 / FAQ — Got questions?

- **When does the hackathon run?** From October 15, 12:01 AM IST to October 18, 11:59 PM IST. Submissions close at 11:59 PM IST on October 18.
- **Who can participate?** The hackathon is open to developers worldwide. You can participate solo or with a team of up to four people.
- **Do I need graph database experience?** No. The getting started guide and the kickoff session cover the basics you need to begin.
- **Is FalkorDB mandatory?** Yes. FalkorDB must be the primary graph database, and it must support a central part of the product.
- **Can I enter more than one track?** Yes. You can enter one, two or all three, and each track has its own prize. As a guide: an agent that acts on data fits Track 01, one that remembers or coordinates fits Track 02, and one that works with company knowledge fits Track 03.
- **Where do I register?** Right here on WeMakeDevs. Sign in, or create a free account, then hit Register now on this page. Your team and your submission are managed from the same panel.
- **Can I use any programming language?** Yes. You may use any language, framework, frontend, or deployment platform that works with your project.
- **Can I continue an existing project?** You may reuse general libraries, templates, and infrastructure. The submission and its main FalkorDB implementation must be new work completed during the event.
- **Can I use coding assistants?** Yes. You remain responsible for the code, architecture, security, and correctness of the project, and you must be able to explain what was built and why.
- **Does the project need to be deployed?** A live deployment is preferred. Projects that cannot be deployed must include complete local setup instructions and a working demo video.

## Key facts and numbers

- **Dates/times:** Oct 15, 12:01 AM → Oct 18, 11:59 PM GMT+5:30 (IST); submissions close 11:59 PM IST on October 18; submissions open on the panel 17 Oct 2026, 01:03; countdown at capture "Ends in 2 days, 20 hours".
- **Prize pool:** $20,000 total — 3 track prizes (iPhone 18 Pro; PS5 with GTA VI; M6 Mac Mini) + 2 side prizes (AirPods 5 for best blog post, T-shirt for each member of the top 50 teams).
- **Team limits:** solo up to 4 people; register once; every member of a winning team gets the prize.
- **Registration:** 7,345 registered at capture (a later Oct 17 capture shows **7,671**); team code 25F934; user's team cto-ai at 1 of 4 seats.
- **Track count:** 3 (Connected Data; Agent Memory and Coordination; Company Brain) — a project may enter one, two, or all three.
- **FalkorDB facts on the page:** open-source graph database; traversals run on every step of an agent loop; one instance holds thousands of isolated graphs; multigraph topology for one-graph-per-user/tenant; official clients Python, Node.js, Java, Rust, Go, PHP, C#; Docker image `falkordb/falkordb:latest`.
- **Algorithms advertised as agent tools:** Shortest path, PageRank, Centrality, Connected components, Community detection.
- **Frameworks/protocols advertised:** GraphRAG-SDK, QueryWeaver, MCP, Graphiti, Cognee, LangChain, LlamaIndex.
- **Footer/organizer:** "Helping great developer tools reach the builders who will shape the future." — WeMakeDevs; "© 2026 WeMakeDevs. All rights reserved."; footer lists Hackathons, Meetups, Scholarships, Event Calendar, Feedback, Partners, Contact Us (mailto:contact@wemakedevs.org), Blog, Code of Conduct, Privacy Policy, Terms of Service; contact for questions is the FalkorDB Discord.
- **Related page URLs:** Submit — `https://www.wemakedevs.org/hackathons/falkordb/submit`; Schedule — `https://www.wemakedevs.org/hackathons/falkordb/schedule`; Rules — `https://www.wemakedevs.org/hackathons/falkordb/rules`; Resources — `https://www.wemakedevs.org/hackathons/falkordb/resources`.

## Code, commands and queries

Get started with FalkorDB in one line (as shown on the page):

```bash
$ docker pull falkordb/falkordb:latest
```

The "who knows about this system" Cypher example:

```cypher
MATCH (p:Person)-[:WORKED_ON]->(:Project)-[:USES]->(s:System {name: $system})
RETURN p.name AS person, count(*) AS projects
ORDER BY projects DESC
LIMIT 5
```

## Hackathon relevance

- This is the event itself: any agent built for it must use **FalkorDB as the primary graph database** supporting a central part of the product.
- Track selection guide straight from the FAQ: acts-on-data → **Track 01**; remembers/coordinates → **Track 02**; works with company knowledge → **Track 03**; a project may target one, two or all three.
- The "work the graph has to do" list doubles as the judging rubric: multi-hop following, cross-session memory, shared state between agents, people/project/decision links, and traceable answer paths.
- The sponsor section names the exact stack to lean on: GraphRAG-SDK, QueryWeaver, MCP tool selection, Graphiti/Cognee memory, LangChain, LlamaIndex, plus FalkorDB Browser for demo visuals.
- Deployment expectations: live deployment preferred; otherwise complete local setup instructions + working demo video.
- During the event, use the **FalkorDB Discord** for team-finding and graph-model help; submissions open 17 Oct 2026, 01:03 and teams are locked after submission.

## Related notes

- [event-rules.md](event-rules.md) — the full 18 rules this page summarizes (removal test, submission pack, AI disclosure).
- [event-resources.md](event-resources.md) — the event's curated build-resources page.
- [event-submit.md](event-submit.md) — the actual submission form (8 questions, required fields).
- [blog-how-to-build-an-agent.md](blog-how-to-build-an-agent.md) — WeMakeDevs' own tutorial for this event's brief.
- [docs-home.md](docs-home.md) — the "Get started" documentation the FAQ points to for beginners.
- [cloud-sign-up.md](cloud-sign-up.md) — the FalkorDB Cloud account flow needed to run an instance during the event.
- [repo-falkordb.md](repo-falkordb.md) — the open-source engine behind the sponsor section (`falkordb/falkordb` Docker image).
- [../../guide/11-hackathon-playbook.md](../../guide/11-hackathon-playbook.md) — the course's hackathon playbook for this exact event.
