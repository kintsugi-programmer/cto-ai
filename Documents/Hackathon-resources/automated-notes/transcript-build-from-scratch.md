# How to Build a Project From Scratch When You Don't Know Where to Start (Manware)

> **Source:** [`Transcript copy 19.txt`](../Transcript%20copy%2019.txt) · **Type:** video transcript · **Saved:** Oct 18, 2026 · **Original URL:** https://www.youtube.com/watch?v=paP7p87Mb50

## Overview

- A developer (channel: **Manware**) builds a complete full-stack app **from an idea to a working product on camera** — "how I go from an idea to a full stack app" — and leaves in the challenges that tutorials usually cut out.
- Framing: programming alone is hard; you are expected to conjure a finished project with no blueprint, and asking for help makes you feel like an impostor. "If you want to become a real developer, you need to learn how to sit down with a blank page and actually figure this out."
- The video shares **three strategies** to apply immediately: **blueprint**, **division**, and **systems** — advertised to "save you hundreds of hours of wasteful thinking."
- Honesty hook: the creator had only been **vibe coding for the last 6 months** and had not touched the stack he uses "in over 1.5 years" — "there's a very real chance I completely [mess] this up."
- The project: **"Which gamer color are you?"** — a gamer personality test that deduces your gamer archetype from quiz answers, inspired by **radiocolor.com** [site name as heard; unclear], which does the same for book readers and ends with a beautiful graph showing where the archetype lies.

## The project: a gamer personality test

- Six archetypes: **competitor, strategist, explorer, creator, socializer, collector** (renamed to "much cooler" names during the build).
- **Algorithm research**: no idea how personality algorithms work (if statements? machine learning? neural networks?). Learned that most modern tests use a **weighted vector scoring system**: each option carries scores/weights per trait; you add the scores with every answer, and the trait with the highest score becomes the archetype.
- **Simplification**: instead of each trait having its own weight, place **opposite traits on a spectrum** — adding +10 to "mind" also deducts 10 from "heart"; the final score becomes coordinates on a 2D graph.
- Problem: that works for two spectrums, but six archetypes need **three spectrums**.
- **Hexagon solution** [inspired by "100x hunter" — unclear]: place the three axes as a perfect hexagon; +60 on one axis, +20 on another, −10 on the last; the final location is the **average of the three coordinates** — "an insanely cool-looking graph that leaves users wondering how the algorithm works."
- A secret **seventh archetype — "polymath"** — is unlocked when the result lies very close to the origin (meaning it fits none of the other six). It ships later; in the video he runs out of time to add it.

## Strategy 1: Blueprint (before you open the editor)

- Instead of debating whether to build something: **research, plan, and develop a complete architectural blueprint** of the thing first.
- The blueprint steps he lists, in order:
  - Finish the design of the core logic.
  - Research and pick the technologies.
  - Create the UI/UX in Figma.
  - Design the system architecture — backend and database.
  - Write the core algorithm.
  - Revise all the technologies required, all before opening VS Code.
- Claim: a blueprint makes development **at least 10x easier and much faster**, and it "introduces micro challenges that your dopamine receptors love."

## Strategy 2: Division

- "The strategy every professional developer secretly uses": divide a massive project into **smaller, doable micro challenges**.
- "Building 'which gamer color are you' sounds overwhelming at first, but each individual challenge is much, much easier."
- Planned **development order**: write the backend endpoints and the core logic first — "it is generally much easier to build the front end when you have the back end ready" — then set up the database and finish the rest of the backend, then OAuth, then the dynamic page links, and finally the front end.
- Divide again when a piece is still big: the landing page = moving background, then texts, then button, then the SVG logo.

## Strategy 3: Systems (and problem triage)

- "Always work in systems and routines." When a massive goal meets an obstacle, first divide it into micro challenges, then ask: **what kind of problem is this?**
  - **Memory problem** — "I don't remember the syntax." Look it up with Google, ChatGPT, or the docs, and do not feel bad: "memorization is not engineering."
  - **Knowledge problem** — "I don't remember how flexbox or OAuth works." Learn the **minimum knowledge needed for the current challenge**.
  - **Problem-solving challenge** — "What should my caching strategy be? How should I design this API?" Come up with approaches **yourself first**, and only then seek help.
  - **Debugging problem** — "Why is this error coming?" It is usually one of the three above; categorize it, then fix it.
- AI usage policy for the whole build: "I will be using ChatGPT the same way [we used Google] as a search engine, **not a replacement for my brain**."

## The build (all real failures left in)

- **Blueprint outputs**: Next.js (chosen for features like **server components and routing**; HTML/CSS/JS and even React are "very limited"; the real reason: "I don't know the others"), **Neon** for backend + database (disclosed sponsor payout: "they are paying me money to use it"), Figma UI, **3 API endpoints**, **2 database tables**.
- **System architecture** derived from the UI: only **three backend APIs** — (1) calculate the archetype and final result when the quiz finishes, (2) fetch results again when friends open the copied link, (3) authentication.
  - Endpoint 1 contract: input = array of quiz answers; output = archetype, x/y coordinates, and the link slug. It calls functions to calculate the score, the archetype, the graph coordinate, and to save the result in the DB **with the link slug as the primary key**.
- **Database**: two simple tables — **results** and **users**.
- **Core algorithm implementation**: keep adding the weights per answer for the final scores; the archetype is the highest weight; a hidden seventh archetype (polymath) near the origin; coordinates via "basic trigonometry" he had to revise. He asked the AI for a quick personalized cheat sheet — "such a timesaver." He also discovered Next.js is now a completely different framework and had to watch videos about it.
- **Setup story**: `npx create next app` (name cannot contain capital letters); choices: TypeScript, ESLint, React compiler, Tailwind CSS, app router; asked ChatGPT whether to enable the React compiler ("used to be very OP in beta") and enabled it.
  - NPM install failed ("allow scripts is not allowed in project scope" — related to esbuild [unclear]); even the AI could not fix it; workaround: skip installation and run `npm install` manually later.
  - Forgot the manual `npm install` after re-creating the project with the `--src` flag (to get a `src` directory) — so `npm run dev` failed with "Next is not recognizable." Deleted the repository and ran the setup again; finally working.
  - He had to disable/notice his AI autocomplete ("kodium" [Codeium? unclear]) still being on.
- **Endpoints**: request-body syntax fetched from the AI ("I don't know the syntax problem"); wrote response handling and error handling; then the three functions (score vector, archetype, coordinates) in a `utils` file — started from pseudo-code he had written in **Notion**; link slug generated with **Nanoid** (AI's recommendation: "the best approach is to use Nanoid").
- **Neon setup (first time)**: called it "a complete backend platform with authentication, object storage, functions, and an API gateway." Followed the docs instead of the video walkthrough ("reading documentation is usually much faster"): create a Neon project → create the Next.js project + add dependencies (one command) → store credentials in the env file — "very common steps you will see in 90% of the documentation" → configure the Postgres client (the app-router line establishes the connection; send the SQL query, get the response).
  - Errors while testing: "Argument of type string is not..." (a syntax problem he knew how to fix); tried "use client" without success; realized the temp file was inside the **API directory** (backend endpoints only) and moved it to a frontend folder in the app directory — then it worked on the first try.
  - Console tour: monitor activity, tables (with an ER-diagram view — "the table was born"), a SQL editor, backup and restore; created the tables in the console; pushed data through backend code with his own hand-written insert query; tested with a POST request; "first try" — "easier to set up than MongoDB."
- **Second endpoint bug**: "URL rejected: port number was not a decimal number" — Windows shenanigans; advised that Next.js route handlers should not take a JSON body on GET; use query parameters instead — fixed.
- **Front end**: divided into four parts — landing page, quizzes page, results page, auth page. The quiz shows a counter at the top; after the last question you are "teleported" to the results screen (hardcoded at first).
  - Curved text was the first real **problem-solving challenge** (no CSS property for it; first idea: place every character separately). Solved by asking AI for options → **exporting the text as an SVG from Figma** ("Figma renders shadows and strokes much better than HTML/CSS — I should be doing this for every component").
  - Connecting frontend to backend hit "can't access property of undefined" from `results.tsx`: the archetype was missing from `archetypes.json` (polymath not added) and the archetype map had capital-letter casing — fixed the casing; result "architect" was "pretty close to polymath."
- **Dynamic links**: read the URL, send the slug to the backend, get the archetype + x/y coordinates, plug into the results component; Next.js dynamic URLs = folder + `page.tsx` + slug parameter with TypeScript.
  - Bug: "failed to fetch the results" — traced back through the backend, tried another record, found the endpoint was not returning the slug — **"the AI gave the wrong endpoint"**; fixed.
- **OAuth ("final boss")**: enable OAuth in the Neon project → install the Neon SDK → set up environment variables → create files and paste the code from the documentation → Google sign-in worked. "Literally the only thing I did was copy those commands from the documentation."
  - On the Neon free tier: "more than anything you'll ever need for a personal project."
- **Conclusion**: "With the help of division, blueprint, and the system, we finished this project like it was nothing." He then plays his own quiz on camera (Breath of the Wild, Elden Ring, Minecraft tastes; "top 500 Clash Royale players" fought) and finds the result "so accurate."

## Key facts and numbers

- Three strategies: **blueprint, division, systems**; four problem categories: **memory, knowledge, problem solving, debugging**.
- Project: gamer personality test; **6 archetypes + 1 hidden** (polymath); **3 spectrums** on a hexagon; coordinates averaged.
- Architecture: **3 API endpoints** (results, shared-link fetch, auth) and **2 tables** (`results`, `users`).
- Timelines/context: **6 months** of vibe coding; **1.5+ years** away from the stack used.
- Claim: blueprint makes development **at least 10x easier and much faster**.
- Stack: Next.js (App Router, TypeScript, ESLint, React compiler, Tailwind), Neon (Postgres + auth), Figma, Nanoid, Notion for pseudo-code, ChatGPT as a search engine, docs-first learning.
- Tools named: Neon free tier ("more than anything you'll ever need for a personal project"), Nanoid, SQL editor with ER view, backup/restore.

## Hackathon relevance

- The **blueprint** strategy is the guide's "model the graph first" in action: decide logic, UI, architecture, and data before writing app code — the same order the event's rules reward.
- **Division** maps directly onto a hackathon weekend: micro-challenge the build, backend first, frontend last — exactly the earlier deadline advice.
- **Systems triage** (memory / knowledge / problem solving / debugging) is the antidote to "where do I even start" paralysis; it turns a stuck moment into a labeled problem with a known next step.
- "AI as a search engine, not a replacement for my brain" is the same policy the event rules demand: assistants are allowed, must be disclosed, and you must understand what you submit.
- The visible failures (broken installs, undefined props, wrong AI-suggested endpoints) are what hackathon builds look like — the video proves the same debugging process gets you through.

## Related notes

- [blog-how-to-build-an-agent.md](blog-how-to-build-an-agent.md) — the event's own tutorial build (an agent over a graph) that pairs well with this general build process.
- [event-rules.md](event-rules.md) — AI disclosure and understanding requirements this video's workflow respects.
- [transcript-falkordb-ama.md](transcript-falkordb-ama.md) — the performance and reading-strategy tips from the FalkorDB team, another take on keeping builds fast.
- [../../guide/15-building-from-scratch.md](../../guide/15-building-from-scratch.md) — the guide module distilled from this video.
- [../../guide/14-demo-and-submission.md](../../guide/14-demo-and-submission.md) — the submission side the video's build ends just short of.
