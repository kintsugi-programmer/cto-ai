# Hackathon Playbook

Everything you need to comply with and aim at winning: **Graph Hacks: Context for AI Agents**, powered by FalkorDB.

## The challenge

- **Build** a working agent, or a group of agents, with **FalkorDB as its context layer**.
- **The hard rule**: the graph must shape what the agent does, not sit on the side. FalkorDB must be the primary graph database and support a central part of the product.
- **What the work must do**:
  - Follow connections across data.
  - Remember across sessions.
  - Share state between agents.
  - Connect people, projects, and decisions.
  - Show the path behind an answer.

## Tracks and prizes

- **Track 01 - Agents That Act on Connected Data**: the graph drives decisions and actions (fraud investigation, security triage, codebase work).
  - Focus: multi-hop reasoning, graph queries and algorithms as agent tools, tool selection through MCP, actions based on what the graph shows, explainable results.
  - Prize: iPhone 18 Pro.
- **Track 02 - Agent Memory and Coordination**: agents remember across sessions and share state with each other.
  - Focus: episodic, semantic, and procedural memory; persistent conversation history; shared state and handoffs; high-concurrency reads and writes; separate memory per user or tenant.
  - Prize: PS5 with GTA VI.
- **Track 03 - Company Brain**: one graph of people, teams, projects, documents, and decisions.
  - Focus: knowledge from docs, tickets, and chats in one graph; who owns what and who knows what; tracing decisions to their source; keeping knowledge current; answers with clear sources.
  - Prize: M6 Mac Mini.
- **Side prizes**: AirPods 5 for the best blog post; Top 50 projects get a T-shirt for every team member.
- You may enter one, two, or all three tracks. Every member of a winning team gets the prize.

## Key facts

- **Dates**: Oct 15, 12:01 AM to Oct 18, 11:59 PM IST (GMT+5:30). Submissions close at 11:59 PM IST on Oct 18.
- **Where**: online, from anywhere. Free to enter.
- **Teams**: solo or up to 4 people. 7,345 registered. Team `cto-ai`, team code `25F934`.
- **Submissions open**: Oct 17, 2026, 01:03. You cannot change your team after submitting.
- **No graph database experience needed**, and the getting started guide plus kickoff session cover the basics.
- Use any language, framework, frontend, and deployment platform.

## Rules to respect

- **New work**: you may reuse general libraries, templates, and infrastructure, but the submission and its main FalkorDB implementation must be built during the event.
- **Coding assistants are allowed**; you remain responsible for code, architecture, security, and correctness, and must be able to explain what was built and why.
- **Deployment**: a live deployment is preferred. If it cannot be deployed, include complete local setup instructions and a working demo video.

## Build checklist

- **Pick a question where the answer depends on connections**, for example "Which accounts are linked to this flagged transaction?"
- **Model the graph first**: decide nodes, relationships, and properties before writing app code.
- **Run FalkorDB**: Docker one-liner or a Cloud free instance.
- **Give the agent tools**: Cypher queries, graph algorithms, and/or the GraphRAG SDK, exposed through MCP where useful.
- **Add memory**: save episodes, facts, and outcomes; let the agent read them in the next session.
- **Trace everything**: keep the path from question to answer so you can show it in the demo.
- **Write the blog post**: it is a separate side prize and doubles as your demo script.

```cypher
MATCH (p:Person)-[:WORKED_ON]->(:Project)-[:USES]->(s:System {name: $system})
RETURN p.name AS person, count(*) AS projects
ORDER BY projects DESC
LIMIT 5
```

- The query above is the event's own example of "who knows about this system" - a good test for your graph model.
