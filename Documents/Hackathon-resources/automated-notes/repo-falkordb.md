# FalkorDB — Super-Fast Graph Database (FalkorDB/FalkorDB)

> **Source:** [`FalkorDB_FalkorDB_ A super fast Graph Database uses GraphBLAS under the hood for its sparse adjacency matrix graph representation. Our goal is to provide the best Knowledge Graph for LLM (GraphRAG)..mhtml`](../FalkorDB_FalkorDB_%20A%20super%20fast%20Graph%20Database%20uses%20GraphBLAS%20under%20the%20hood%20for%20its%20sparse%20adjacency%20matrix%20graph%20representation.%20Our%20goal%20is%20to%20provide%20the%20best%20Knowledge%20Graph%20for%20LLM%20%28GraphRAG%29..mhtml) · **Type:** GitHub repo · **Saved:** Oct 16, 2026 · **Original URL:** https://github.com/FalkorDB/FalkorDB

## Overview
- The official FalkorDB repository: a super-fast, multi-tenant graph database that uses GraphBLAS under the hood for its sparse adjacency matrix graph representation; the stated goal is to provide the best Knowledge Graph for LLM (GraphRAG).
- FalkorDB describes itself as the first queryable Property Graph database to leverage sparse matrices for representing the adjacency matrix in graphs and linear algebra for querying.
- The repository is the Rust implementation of FalkorDB: it builds the `falkordb` Redis module (`libfalkordb.{so,dylib}`) from Rust, using GraphBLAS sparse matrices for graph storage and traversal.
- The README covers unique features, a Docker quick start, a MotoGP Python example, Redis-client usage, official and additional client library tables, and a full developer guide (Dev Container, manual Rust build, native-dependency cache, test suites).
- Repository stats at save time: 10.2k stars, 566 forks, 44 watchers, 89 releases (v6.0.2 latest, Oct 8, 2026), 81 contributors, 2,501 commits; licensed under SSPLv1.

## Unique features
- Our goal is to build a high-performance Knowledge Graph tailored for Large Language Models (LLMs), prioritizing exceptionally low latency to ensure fast and efficient information delivery through our Graph Database.
- 🆕 FalkorDB is the first queryable Property Graph database to leverage sparse matrices for representing the adjacency matrix in graphs and linear algebra for querying.

### Key features
- **Sparse Matrix Representation:** Utilizes sparse matrices to represent adjacency matrices, optimizing storage and performance.
- **Linear Algebra Querying:** Employs linear algebra for query execution, enhancing computational efficiency.
- **Property Graph Model Compliance:** Supports nodes and relationships with attributes, adhering to the Property Graph Model.
- **OpenCypher Support:** Compatible with OpenCypher query language, including proprietary extensions for advanced querying capabilities.

Explore FalkorDB in action by visiting the Demos.

## Get started

### Step 1
To quickly try out FalkorDB, launch an instance using docker:

```bash
docker run -p 6379:6379 -p 3000:3000 -it --rm -v ./data:/var/lib/falkordb/data falkordb/falkordb
```

### Step 2
Then, open your browser and navigate to http://localhost:3000.

You can also interact with FalkorDB using any of the supported Client Libraries.

### MotoGP League example
In this example, we'll use the FalkorDB Python client to create a small graph representing a subset of motorcycle riders and teams participating in the MotoGP league. After creating the graph, we'll query the data to explore its structure and relationships.

```python
from falkordb import FalkorDB

# Connect to FalkorDB
db = FalkorDB(host='localhost', port=6379)

# Create the 'MotoGP' graph
g = db.select_graph('MotoGP')
g.query("""CREATE (:Rider {name:'Valentino Rossi'})-[:rides]->(:Team {name:'Yamaha'}),
                  (:Rider {name:'Dani Pedrosa'})-[:rides]->(:Team {name:'Honda'}),
                  (:Rider {name:'Andrea Dovizioso'})-[:rides]->(:Team {name:'Ducati'})""")

# Query which riders represents Yamaha?
res = g.query("""MATCH (r:Rider)-[:rides]->(t:Team)
                 WHERE t.name = 'Yamaha'
                 RETURN r.name""")

for row in res.result_set:
	print(row[0])

# Prints: "Valentino Rossi"

# Query how many riders represent team Ducati ?
res = g.query("""MATCH (r:Rider)-[:rides]->(t:Team {name:'Ducati'})
                 RETURN count(r)""")

print(res.result_set[0][0])
# Prints: 1
```

## Using FalkorDB
You can call FalkorDB's commands from any Redis client. Here are several methods:

### With redis-cli

```bash
$ redis-cli
127.0.0.1:6379> GRAPH.QUERY social "CREATE (:person {name: 'roi', age: 33, gender: 'male', status: 'married'})"
```

### With any other client
You can interact with FalkorDB using your client's ability to send raw Redis commands.

Note: Depending on your client of choice, the exact method for doing that may vary.

#### Example: Using FalkorDB with a Python client
This code snippet shows how to use FalkorDB from Python using `falkordb-py`:

```python
from falkordb import FalkorDB

# Connect to FalkorDB
db = FalkorDB(host='localhost', port=6379)

# Select the social graph
g = db.select_graph('social')

reply = g.query("CREATE (:person {name:'roi', age:33, gender:'male', status:'married'})")
```

## Client libraries
Note: Some languages have client libraries that provide support for FalkorDB's commands.

### Official clients

| Project | Language | License | Author | Package | Comment |
|---|---|---|---|---|---|
| jfalkordb | Java | BSD | FalkorDB | Maven | — |
| falkordb-py | Python | MIT | FalkorDB | pypi | — |
| falkordb-ts | Node.JS | MIT | FalkorDB | npm | — |
| falkordb-rs | Rust | MIT | FalkorDB | Crate | — |
| falkordb-go | Go | BSD | FalkorDB | GitHub | — |
| NFalkorDB | C# | Apache-2.0 | FalkorDB | nuget | — |

### Additional clients

| Project | Language | License | Author | Package | Comment |
|---|---|---|---|---|---|
| nredisstack | .NET | MIT | Redis | nuget | — |
| redisgraph-rb | Ruby | BSD | Redis | GitHub | — |
| redgraph | Ruby | MIT | pzac | GitHub | — |
| redisgraph-go | Go | BSD | Redis | GitHub | — |
| rueidis | Go | Apache 2.0 | Rueian | GitHub | — |
| ioredisgraph | JavaScript | ISC | Jonah | GitHub | — |
| @hydre/rgraph | JavaScript | MIT | Sceat | GitHub | — |
| php-redis-graph | PHP | MIT | KJDev | GitHub | — |
| redisgraph_php | PHP | MIT | jpbourbon | GitHub | — |
| redisgraph-ex | Elixir | MIT | crflynn | GitHub | — |
| redisgraph-rs | Rust | MIT | malte-v | GitHub | — |
| redis_graph | Rust | BSD | tompro | GitHub | — |
| rustis | Rust | MIT | Dahomey Technologies | Crate | Documentation |
| NRedisGraph | C# | BSD | tombatron | GitHub | — |
| RedisGraph.jl | Julia | MIT | xyxel | GitHub | — |

## Documentation
The README links: Official Docs · Clients · Commands · 📊 Latest Performance Benchmarks.

### Community and support
- **Discussions:** Join our community discussions on GitHub Discussions to ask questions, share ideas, and connect with other users.
- **Contributing:** We welcome contributions! See the Developer Guide below to build FalkorDB from source and run the test suites.
- **License:** This project is licensed under the Server Side Public License v1 (SSPLv1). See the LICENSE file for details.

## Developer guide
This repository is the Rust implementation of FalkorDB. It builds the `falkordb` Redis module (`libfalkordb.{so,dylib}`) from Rust, using GraphBLAS sparse matrices for graph storage and traversal.

### Quick start with Dev Container (recommended)
The easiest way to get started is using the development container, which includes all dependencies pre-installed:
- Install Docker and VS Code.
- Install the Dev Containers extension.
- Open this project in VS Code.
- Click "Reopen in Container" when prompted (or press F1 and select "Dev Containers: Reopen in Container").
- Wait for the container to build (first time takes ~10-15 minutes).
- Start developing! All dependencies are ready to use.

See `.devcontainer/README.md` for more details.

### Manual setup
If you prefer to set up the environment manually:

#### Build

```bash
cargo build
```

#### Dependencies
GraphBLAS, LAGraph, and RediSearch must be built and installed before building this project.

##### Toolchain prerequisites

| Host | Compiler | OpenMP runtime |
|---|---|---|
| macOS | `brew install llvm` (provides clang with OpenMP support) | `brew install libomp` |
| Linux | clang-23 (e.g. from apt.llvm.org) | `apt install libomp-23-dev` |

Local builds use whatever OpenMP package is on the system — `build/libomp.sh` is not required for local development. It is only invoked by the Docker toolchain image (`build/Dockerfile`) to produce `/opt/libomp/lib/libomp.a`, which lets the published `libfalkordb.{so,dylib}` embed libomp statically and have no `libomp.so.5` / `libgomp.so.1` / `libomp.dylib` runtime dependency. A locally-built artifact will dynamically link the system libomp instead — fine for dev, but CI/Docker is the source of truth for the self-contained image.

If you do want a self-contained local artifact (e.g. to mirror the Docker build), run `build/libomp.sh` with a writable PREFIX and point `graph/build.rs` at it via `LIBOMP_PREFIX`:

```bash
CC=$(brew --prefix llvm)/bin/clang PREFIX=$HOME/libomp ./build/libomp.sh
LIBOMP_PREFIX=$HOME/libomp cargo build
```

The script auto-detects the libomp source release from `${CC:-clang} --version`, so it stays ABI-matched to your compiler with no manual version arg. In Docker the same auto-detection runs against `clang-${CLANG_MAJOR}`, eliminating the prior drift risk between the apt-installed clang and a hand-pinned `LLVMORG_VERSION`.

##### Building the native dependencies
GraphBLAS, LAGraph and RediSearch are git submodules under `deps/`, built by the `native-deps` crate. git owns those checkouts — native-deps only builds what is there, so populate them first.

On macOS, point the build at Homebrew clang first: the system clang has no OpenMP, and GraphBLAS would build single-threaded without saying so.

```bash
export CC=$(brew --prefix llvm)/bin/clang
export CXX=$(brew --prefix llvm)/bin/clang++
```

```bash
git submodule update --init --recursive
cargo build   # graph/build.rs calls native-deps; nothing else to run
```

(`git clone --recurse-submodules` does the first step for you.)

`cargo build` builds any missing dependency automatically, so the explicit step below is only needed if you want to build them ahead of time or inspect the result:

```bash
cargo run --manifest-path native-deps/Cargo.toml
```

###### The artifact cache
Results are cached at `${XDG_CACHE_HOME:-$HOME/.cache}/falkordb/native-deps/<dep>/<key>/` (`$FALKORDB_DEPS_CACHE` overrides the root). The key covers everything the artifacts are ABI-tied to: the submodule revision, the `GB_control` patch, the vendored PreJIT kernels, the recipe sources, `$CC/$CXX --version`, the target triple and the OpenMP/sanitizer flavour. Worktrees therefore share archives, and a compiler bump can never yield a stale-ABI cache hit.

`$FALKORDB_NATIVE_DEPS_PREBUILT` names extra read-only roots to search first; the Docker images use it to expose the artifacts their dep stages built.

###### Bumping a dependency
Move the gitlink the ordinary way, then regenerate the lock file:

```bash
git -C deps/RediSearch checkout <sha>
git add deps/RediSearch
cargo run --manifest-path native-deps/Cargo.toml -- lock
```

`deps/native-deps.lock` mirrors the gitlinks as a plain file, because a Docker build context has no `.git` for the dep stages to read. CI enforces that the two agree via `lock --check`.

##### pytest
- pytest — create virtualenv and install `tests/requirements.txt`. The virtual environment should be activated before running tests.

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r tests/requirements.txt
```

### Testing
- run unit tests with `cargo test -p graph`
- run e2e and function tests with `pytest tests/test_e2e.py tests/test_functions.py -vv`
- run MVCC and concurrency tests with `pytest tests/test_mvcc.py tests/test_concurrency.py -vv`
- run flow tests with `./flow.sh`
- run tck tests with `pytest tests/tck/test_tck.py -s`

There is an option to run only part of the TCK tests and stop on the first fail:

```bash
TCK_INCLUDE=tests/tck/features/expressions/list pytest tests/tck/test_tck.py -s
```

To run all passing TCK tests use:

```bash
TCK_DONE=tck_done.txt pytest tests/tck/test_tck.py -s
```

## License
Licensed under the Server Side Public License v1 (SSPLv1). See LICENSE.

### Support our work
- ⭐️ If you find this repository helpful, please consider giving it a star!
- ↗️ Graph, graph database, RAG, graphrag, Retrieval-Augmented Generation, Information Retrieval, Natural Language Processing, LLM, Embeddings, Semantic Search

## About this repository
- **Description:** A super fast Graph Database uses GraphBLAS under the hood for its sparse adjacency matrix graph representation. Our goal is to provide the best Knowledge Graph for LLM (GraphRAG).
- **Homepage:** www.falkordb.com/
- **Topics:** cloud-database, database, database-as-a-service, developer-tools, devtools, graph-database, graphrag, knowledge-graph, realtime-database.
- **Repository resources:** Readme, License, Code of conduct, Contributing, Security policy.
- **Stars:** 10.2k stars · **Watchers:** 44 watching · **Forks:** 566 forks.
- **Issues / PRs:** 727 issues, 268 pull requests.
- **Branches / tags:** 661 branches, 246 tags (default branch: main).
- **Commits:** 2,501 commits. Latest commit `0f45a86` by AviAvni and claude: "fix: bulk-imported attribute spans never overflow Slot::len (#2539)", dated Oct 15, 2026 (7 hours before save).
- **Releases:** 89 releases; latest **v6.0.2** (Oct 8, 2026) — "+ 88 releases".
- **Packages:** 1 — `falkordb-bench`.
- **Contributors:** 81 (+ 67 contributors beyond the avatar row).
- **Languages:** Rust 49.3%, Python 27.7%, Gherkin 13.6%, C 8.7%, Dockerfile 0.3%, ANTLR 0.2%, Shell 0.2%.

## Repository structure
Top-level layout (per-file commit messages and dates dropped; the Rust-engine migration below is significant):
- Hidden/config dirs and files: `.cargo`, `.claude`, `.devcontainer` (dev container definition — see `.devcontainer/README.md`), `.github` (CI workflows), `.vscode`.
- `bench` — benchmarks for the engine.
- `build` — build tooling; contains `Dockerfile` (Docker toolchain image) and `libomp.sh`.
- `deps` — git submodules for the native dependencies GraphBLAS, LAGraph and RediSearch, built by the `native-deps` crate.
- `docs` — documentation.
- `fuzz` and `runtime-fuzz-target` — fuzzing targets (with root `fuzz.sh`).
- `graph` — the Rust engine crate (`cargo test -p graph`; `graph/build.rs` invokes native-deps and accepts `LIBOMP_PREFIX`).
- `native-deps` — crate that builds the native dependencies (`cargo run --manifest-path native-deps/Cargo.toml`); `deps/native-deps.lock` lives here.
- `src` — module sources.
- `tests` — pytest suites (`test_e2e.py`, `test_functions.py`, `test_mvcc.py`, `test_concurrency.py`, plus `tck/` for the TCK tests).
- Root files: `Cargo.toml` / `Cargo.lock` (Rust workspace), `build.rs`, `rustfmt.toml`, `pytest.ini`, `flow.sh`, `fuzz.sh`, `flow_tests_done.txt` / `flow_tests_todo.txt` / `tck_done.txt` (test progress lists), `codecov.yml`, `CODEOWNERS`, `CLAUDE.md`, `LICENSE`, `README.md`, `.gitmodules`, `.gitignore`, `.gitattributes`, `.dockerignore`, `input.txt`.
- Note: the default development branch was migrated to the Rust engine ("Migrate the default development branch to the Rust engine (#2279)", Aug 2, 2026), matching several files' last-touch entry.

## Key facts and numbers
- Positioned as the first queryable Property Graph database using sparse matrices for adjacency-matrix representation and linear algebra for querying.
- Goal: best Knowledge Graph for LLMs (GraphRAG), with "exceptionally low latency."
- Quick start ports: `6379` (Redis protocol) and `3000` (browser UI) from image `falkordb/falkordb`.
- Data volume mount in the quick start: `./data:/var/lib/falkordb/data`.
- Dev Container first build: ~10-15 minutes.
- Native deps to build before the project: GraphBLAS, LAGraph, RediSearch — all git submodules under `deps/`.
- Toolchain: macOS — `brew install llvm` + `brew install libomp`; Linux — clang-23 (e.g. from apt.llvm.org) + `libomp-23-dev`.
- Docker builds produce `/opt/libomp/lib/libomp.a` so published `libfalkordb.{so,dylib}` embeds libomp statically (no `libomp.so.5` / `libgomp.so.1` / `libomp.dylib` runtime dependency); local builds link the system libomp dynamically.
- Native-deps cache path: `${XDG_CACHE_HOME:-$HOME/.cache}/falkordb/native-deps/<dep>/<key>/`; root override `$FALKORDB_DEPS_CACHE`; extra read-only roots via `$FALKORDB_NATIVE_DEPS_PREBUILT`.
- Cache key components: submodule revision, the `GB_control` patch, vendored PreJIT kernels, recipe sources, `$CC/$CXX --version`, target triple, OpenMP/sanitizer flavour.
- CI enforces gitlink/lock agreement via `lock --check`; `deps/native-deps.lock` exists because Docker build contexts have no `.git`.
- Repo stats: 10.2k stars · 44 watchers · 566 forks · 727 issues · 268 pull requests · 661 branches · 246 tags · 2,501 commits · 89 releases (v6.0.2, Oct 8, 2026) · 1 package (`falkordb-bench`) · 81 contributors.
- Languages: Rust 49.3% · Python 27.7% · Gherkin 13.6% · C 8.7% · Dockerfile 0.3% · ANTLR 0.2% · Shell 0.2%.
- License: Server Side Public License v1 (SSPLv1).
- README example facts: MotoGP riders — Valentino Rossi (Yamaha), Dani Pedrosa (Honda), Andrea Dovizioso (Ducati); query "Which riders represent Yamaha?" prints "Valentino Rossi"; Ducati count returns 1. Social-graph example person: `name:'roi', age:33, gender:'male', status:'married'`.

## Code, commands and queries
All snippets appear verbatim in the sections above; quick command reference:

```bash
docker run -p 6379:6379 -p 3000:3000 -it --rm -v ./data:/var/lib/falkordb/data falkordb/falkordb
```

```bash
cargo build
```

```bash
git submodule update --init --recursive
cargo build   # graph/build.rs calls native-deps; nothing else to run
```

```bash
cargo test -p graph
pytest tests/test_e2e.py tests/test_functions.py -vv
pytest tests/test_mvcc.py tests/test_concurrency.py -vv
./flow.sh
pytest tests/tck/test_tck.py -s
```

Cypher through redis-cli:

```bash
127.0.0.1:6379> GRAPH.QUERY social "CREATE (:person {name: 'roi', age: 33, gender: 'male', status: 'married'})"
```

## Hackathon relevance
- The one-line `docker run` gives an instant FalkorDB context layer for an agent — Redis protocol on 6379 plus a visual browser on port 3000 for inspecting the graph (`connected data` track).
- The Python examples (`FalkorDB(host, port)`, `select_graph`, `g.query`) show the minimal API surface for wiring an agent's memory graph (`agent memory and coordination` track) — mirrors the MotoGP and social-graph patterns.
- Multi-tenant positioning plus property-graph model make it suitable for per-team or per-user graphs in a company-brain style app (`company brain` track).
- OpenCypher support (with proprietary extensions) means standard Cypher knowledge transfers directly to hackathon queries.
- License note: the server is SSPLv1, so check licensing before building a closed-source service on it; the GraphRAG-SDK and client libraries ship under their own licenses (MIT/BSD/Apache-2.0).
- Useful developer commands (cargo tests, pytest suites, flow.sh, TCK) if the team wants to run local builds or demonstrate engine-level testing.

## Related notes
- [docs-home.md](docs-home.md) — FalkorDB documentation home; the fastest way to explore official docs linked from this README.
- [docker-image.md](docker-image.md) — details of the `falkordb/falkordb` image used in the quick-start command.
- [repo-benchmark.md](repo-benchmark.md) — the benchmarking tool behind FalkorDB's performance claims.
- [blog-falkordb-vs-neo4j.md](blog-falkordb-vs-neo4j.md) — benchmark context for "super fast" vs Neo4j.
- [../../guide/02-falkordb.md](../../guide/02-falkordb.md) — hackathon course module introducing FalkorDB.
