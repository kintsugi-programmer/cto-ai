# FalkorDB/benchmark — graph database benchmarking tool

> **Source:** [`FalkorDB_benchmark_ A benchmarking tool to evaluate and compare the performance of graph databases with customizable workloads and metrics..mhtml`](../FalkorDB_benchmark_%20A%20benchmarking%20tool%20to%20evaluate%20and%20compare%20the%20performance%20of%20graph%20databases%20with%20customizable%20workloads%20and%20metrics..mhtml) · **Type:** GitHub repo · **Saved:** Oct 16, 2026 · **Original URL:** https://github.com/FalkorDB/benchmark

## Overview

- `FalkorDB/benchmark` is a public benchmarking tool to evaluate and compare the performance of graph databases with customizable workloads and metrics.
- It powers the public results site at **benchmark.falkordb.com** ("See the benchmarks" link in the README).
- Headline comparison: FalkorDB vs Neo4j on aggregate expansion operations — p99 136.2 ms vs 46,923.8 ms (344.5x faster).
- Besides FalkorDB and Neo4j, the tool now benchmarks **Memgraph, Postgres, MongoDB, and TigerGraph**, with multi-vendor runs and pairwise comparison reports in a web UI (up to 5 engines).
- Implementation: Rust benchmark core (63.3%) + TypeScript UI (24.1%), driven by `just` recipes; MIT licensed.
- Repository stats at save time: 14 stars, 3 watching, 2 forks, 4 open issues, 14 open pull requests, 20 branches, 10 tags, 551 commits, 9 releases, 12 contributors.

## Key benchmark takeaways

> Get mission-critical performance even under extreme workloads, with response times staying under 140ms at p99, while competitors struggle with multi-second latencies. Reduce infrastructure costs and improve user experience with FalkorDB's superior performance profile, requiring fewer resources to handle peak workloads.

| Percentile | FalkorDB (ms) | Neo4j (ms) | Performance Difference |
| --- | --- | --- | --- |
| p50 (median) | 55.0 | 577.5 | 10.5x faster |
| p90 | 108.0 | 4784.1 | 44.3x faster |
| p99 | 136.2 | 46923.8 | 344.5x faster |

## About the benchmarks

- Provides comprehensive performance comparisons between the FalkorDB and Neo4j graph databases.
- Focuses specifically on **aggregate expansion operations**, a common workload in graph database applications.
- Results indicate FalkorDB's particular strength in maintaining consistent performance under varying workload conditions — especially crucial for production environments where predictable response times are essential.

## System requirements

### Prerequisites

- Ubuntu
- Redis server
- build-essential, cmake, m4, automake
- libtool, autoconf, python3
- libomp-dev, libssl-dev
- pkg-config
- Rust toolchain
- SDKman
- unzip, zip

## Installation steps

### Install Redis server

```bash
sudo apt-get install lsb-release curl gpg
curl -fsSL https://packages.redis.io/gpg | sudo gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg
sudo chmod 644 /usr/share/keyrings/redis-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/redis.list
sudo apt-get update
sudo apt-get install redis
```

- stop the redis server: `sudo systemctl stop redis-server`
- disable the redis server: `sudo systemctl disable redis-server`
- check the redis server status: `sudo systemctl status redis-server`

### Install SDKMAN

- install unzip: `sudo apt install unzip zip -y`
- `curl -s "https://get.sdkman.io" | bash`
- load sdkman in the current shell: `source "$HOME/.sdkman/bin/sdkman-init.sh"`

### Build FalkorDB from source

- `git clone --recurse-submodules -j8 https://github.com/FalkorDB/FalkorDB.git`
- `sudo apt install build-essential cmake m4 automake libtool autoconf python3 libomp-dev libssl-dev`
- install rust: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- from the FalkorDB root dir, run `make`

### Build the benchmark from source

From `~/`:

- install pkg-config: `sudo apt install pkg-config -y`
- `git clone git@github.com:FalkorDB/benchmark.git`
- `cd benchmark`
- `sdk env install`
- download and unpack neo4j: `./scripts/download-neo4j.sh`
- build the benchmark: `cargo build --release`
- enable autocomplete: `source <(./target/release/benchmark generate-auto-complete bash)`
- copy the falkor shared lib: `cp ~/FalkorDB/bin/linux-x64-release/src/falkordb.so .`

## Development

- Automation for this repo is driven by **just** — run `just --list` to see every recipe. CI installs just and runs these same recipes, so whatever CI checks exist can be reproduced locally with the identical command.
- Install just (`cargo install just` or `brew install just`) and, for coverage, `cargo-llvm-cov` (`cargo install cargo-llvm-cov`).
- Building the Rust crate also needs **protoc** (`sudo apt-get install -y protobuf-compiler` or `brew install protobuf`).

### Build, lint and test

```bash
just build            # build all targets/features
just clippy           # strict clippy (warnings denied)
just test             # run the unit + integration test suite
just test-one query_builder  # run a single test by name filter
just ci               # everything the Rust CI runs: build + clippy + test
```

### Documentation checks

Markdown docs are validated in CI (the Docs validation workflow) and locally with the same recipe:

```bash
just doc-check        # all doc checks: links + shell examples
just doc-links        # offline broken-link + anchor check (lychee) over tracked *.md
just doc-shell        # bash -n syntax-check the shell (bash/sh) examples in the docs
```

- `just doc-links` runs lychee in `--offline` mode, so it verifies relative and same-file anchor links without network access (external URLs are skipped to keep CI stable). It needs the lychee binary on your PATH — install it locally with `cargo install lychee` or `brew install lychee` (CI installs it automatically via `taiki-e/install-action`).
- Rust code blocks in the docs are compiled as doctests by `just test` (via `src/doc_examples.rs`). Because doctests are run as well as compiled, fence an example that should type-check but not execute with `rust,no_run`, and one that should not compile at all with `rust,ignore` (or a non-Rust language) so it is skipped.

### Code coverage

```bash
just coverage         # generate codecov.json via cargo-llvm-cov
just coverage-html    # open a browsable HTML coverage report
```

- Coverage is uploaded to Codecov by the coverage workflow. Cover new code with tests and keep coverage high — **patch coverage must stay ≥ 90%** (enforced by `codecov.yml`).

### UI dashboard (`ui/`)

```bash
just ui-install       # npm ci
just ui-lint          # lint
just ui-build         # production build
just ui-dev           # start the dev server
just ui-smoke         # Playwright smoke test (starts its own dev server)
```

## Run the benchmark

### Run via helper scripts

Use the wrapper scripts in `scripts/` for the fastest end-to-end benchmark activation:

- `scripts/run_small_benchmark.sh`
- `scripts/run_medium_benchmark.sh`
- `scripts/run_large_benchmark.sh`

Each script handles the full pipeline for its dataset size:

- clears and loads enabled vendors
- generates vendor-specific query files
- runs benchmark workloads
- writes results into a shared `RESULTS_DIR`
- aggregates UI-ready summaries

Quick start:

```bash
./scripts/run_small_benchmark.sh
./scripts/run_medium_benchmark.sh
./scripts/run_large_benchmark.sh
```

Run only Falkor primary + secondary comparison:

```bash
RUN_FALKOR=1 RUN_FALKOR_2=1 RUN_NEO4J=0 RUN_MEMGRAPH=0 ./scripts/run_medium_benchmark.sh
```

Override workload shape:

```bash
QUERIES_COUNT=25000 WRITE_RATIO=0.05 PARALLEL=10 MPS=3000 ./scripts/run_medium_benchmark.sh
```

Point wrappers to external endpoints:

```bash
FALKOR_ENDPOINT=falkor://127.0.0.1:6379 \
FALKOR_ENDPOINT_2=falkor://127.0.0.1:6800 \
NEO4J_ENDPOINT=neo4j://127.0.0.1:7687 \
MEMGRAPH_ENDPOINT=bolt://127.0.0.1:17687 \
./scripts/run_small_benchmark.sh
```

Common environment knobs:

- **vendor toggles:** `RUN_FALKOR`, `RUN_FALKOR_2`, `RUN_NEO4J`, `RUN_MEMGRAPH`
- **workload controls:** `BATCH_SIZE`, `PARALLEL`, `MPS`, `QUERIES_COUNT`, `WRITE_RATIO`, `QUERIES_FILE`
- **algorithm toggles:** `ENABLE_ALGO_PAGERANK`, `ENABLE_ALGO_MAX_FLOW`, `ENABLE_ALGO_MSF`, `ENABLE_ALGO_HARMONIC`
- **output folder:** `RESULTS_DIR`
- **Falkor timeout tuning** (medium/large wrappers): `FALKOR_QUERY_TIMEOUT_MS`

### CLI workflow

#### Generate the docker compose for Prometheus and Grafana

```bash
./generate_docker_compose.sh
```

#### Run the docker compose

```bash
docker-compose up
```

The benchmark is a CLI tool; `cargo run --bin benchmark -- --help` shows:

```text
Usage: benchmark <COMMAND>

Commands:
  generate-auto-complete
  load                    load data into the database
  generate-queries        generate a set of queries and store them in a file to be used with the run command
  run                     run the queries generated by the GenerateQueries command against the chosen vendor
  help                    Print this message or the help of the given subcommand(s)

Options:
  -h, --help     Print help
  -V, --version  Print version
```

#### Load the data

```bash
cargo run --release --bin benchmark -- load --vendor falkor -s small
cargo run --release --bin benchmark -- load --vendor neo4j -s small
cargo run --release --bin benchmark -- load --vendor memgraph -s small
cargo run --release --bin benchmark -- load --vendor postgres -s small
cargo run --release --bin benchmark -- load --vendor mongo -s small
cargo run --release --bin benchmark -- load --vendor tigergraph -s small
```

NOTE: it is possible to use the `load` command with an externally run vendor endpoint:

```bash
cargo run --release --bin benchmark -- load --vendor falkor -s small --endpoint falkor://127.0.0.1:6379
cargo run --release --bin benchmark -- load --vendor neo4j -s small --endpoint neo4j://neo4j:benchmark123@127.0.0.1:7687
cargo run --release --bin benchmark -- load --vendor memgraph -s small --endpoint bolt://127.0.0.1:7687
cargo run --release --bin benchmark -- load --vendor postgres -s small --endpoint postgres://postgres:benchmark123@127.0.0.1:5432/postgres
cargo run --release --bin benchmark -- load --vendor mongo -s small --endpoint mongodb://127.0.0.1:27017/benchmark
cargo run --release --bin benchmark -- load --vendor tigergraph -s small --endpoint http://127.0.0.1:9000
```

Profile-aware loading (runs additional fixture/index setup when required):

```bash
cargo run --release --bin benchmark -- load --vendor neo4j -s small --query-profile fixture-dependent
cargo run --release --bin benchmark -- load --vendor memgraph -s small --query-profile fixture-dependent
cargo run --release --bin benchmark -- load --vendor falkor -s small --query-profile fixture-dependent
```

NOTE: Postgres, Mongo, and TigerGraph do **not** support the `fixture-dependent` profile (no vector/fulltext index equivalent); use `baseline` (default) or `extended-core` instead.

#### Create a set of queries to be used with the run command

```bash
cargo run --release --bin benchmark -- generate-queries -s10000000 --dataset small --name=small-readonly --write-ratio 0.0
```

NOTE: preparing a smaller run of 1,000,000 queries:

```bash
cargo run --release --bin benchmark -- generate-queries -s1000000 --dataset small --name=small-readonly --write-ratio 0.0
```

Generate with a broader coverage profile:

```bash
cargo run --release --bin benchmark -- generate-queries -s1000000 --dataset small --name=small-extended --write-ratio 0.0 --vendor neo4j --query-profile extended-core
cargo run --release --bin benchmark -- generate-queries -s1000000 --dataset small --name=small-fixtures --write-ratio 0.0 --vendor memgraph --query-profile fixture-dependent
cargo run --release --bin benchmark -- generate-queries -s1000000 --dataset small --name=small-readonly-postgres --write-ratio 0.0 --vendor postgres --query-profile baseline
cargo run --release --bin benchmark -- generate-queries -s1000000 --dataset small --name=small-readonly-mongo --write-ratio 0.0 --vendor mongo --query-profile baseline
cargo run --release --bin benchmark -- generate-queries -s1000000 --dataset small --name=small-readonly-tigergraph --write-ratio 0.0 --vendor tigergraph --query-profile baseline
```

#### Run the benchmarks

```bash
cargo run --release --bin benchmark run --vendor falkor --name small-readonly -p40 --mps 4000
cargo run --release --bin benchmark run --vendor neo4j --name small-readonly -p40 --mps 4000
cargo run --release --bin benchmark run --vendor memgraph --name small-readonly -p40 --mps 4000
cargo run --release --bin benchmark run --vendor postgres --name small-readonly-postgres -p40 --mps 4000
cargo run --release --bin benchmark run --vendor mongo --name small-readonly-mongo -p40 --mps 4000
cargo run --release --bin benchmark run --vendor tigergraph --name small-readonly-tigergraph -p40 --mps 4000
```

NOTE: it is possible to use the `run` command with an externally run vendor endpoint:

```bash
cargo run --release --bin benchmark run --vendor falkor --name small-readonly -p40 --mps 4000 --endpoint falkor://127.0.0.1:6379
cargo run --release --bin benchmark run --vendor neo4j --name small-readonly -p40 --mps 4000 --endpoint neo4j://neo4j:benchmark123@127.0.0.1:7687
cargo run --release --bin benchmark run --vendor memgraph --name small-readonly -p40 --mps 4000 --endpoint bolt://127.0.0.1:7687
cargo run --release --bin benchmark run --vendor postgres --name small-readonly-postgres -p40 --mps 4000 --endpoint postgres://postgres:benchmark123@127.0.0.1:5432/postgres
cargo run --release --bin benchmark run --vendor mongo --name small-readonly-mongo -p40 --mps 4000 --endpoint mongodb://127.0.0.1:27017/benchmark
cargo run --release --bin benchmark run --vendor tigergraph --name small-readonly-tigergraph -p40 --mps 4000 --endpoint http://127.0.0.1:9000
```

#### Vendor notes: Postgres

- Postgres connection parameters can also be supplied via environment variables (`POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`) when no `--endpoint` is given, defaulting to `127.0.0.1:5432` with database/user `postgres`.
- A minimal local Postgres for testing can be started with:

```bash
docker run --rm -d --name benchmark-postgres -e POSTGRES_PASSWORD=benchmark123 -p 5432:5432 postgres:16
```

- Postgres is modeled as a plain relational schema (`users`, `friend_edges` tables) rather than Apache AGE.
- Most Cypher query families have a direct SQL translation; a handful — `shortest_path`, `shortest_path_with_filter`, `all_shortest_paths_len`, `pattern_cycle` — are **Postgres-only** (via recursive CTEs) since MongoDB's `$graphLookup` can't express them.
- Algorithm procedures (`pageRank`/`maxFlow`/`MSF`/`harmonic`) plus vector/fulltext smoke queries have no SQL equivalent and are **always excluded** from the Postgres catalog.
- See `QUERY_EXPLANATIONS_AND_SAMPLES.md` for the full capability matrix and SQL templates.

#### Vendor notes: Mongo

- Mongo connection parameters can also be supplied via environment variables (`MONGO_URI` for a full connection string, or `MONGO_HOST`/`MONGO_PORT`/`MONGO_USER`/`MONGO_PASSWORD`/`MONGO_DB`) when no `--endpoint` is given, defaulting to `127.0.0.1:27017` with database `benchmark`.
- A minimal local MongoDB for testing can be started with:

```bash
docker run --rm -d --name benchmark-mongo -p 27017:27017 mongo:7
```

- Mongo is modeled as two collections, `users` and `friend_edges`, traversed with `$graphLookup`.
- Most Cypher query families have a direct aggregation-pipeline translation, but `shortest_path`, `shortest_path_with_filter`, `all_shortest_paths_len`, and `pattern_cycle` are Postgres-only (`$graphLookup` returns an unordered reachable set and cannot enumerate distinct paths or verify cyclic patterns).
- Algorithm procedures plus vector/fulltext smoke queries have no aggregation equivalent and are **always excluded** from the Mongo catalog.
- `temporal_spatial_roundtrip` requires **MongoDB 6.0+** (uses the `$documents` aggregation stage).
- See `QUERY_EXPLANATIONS_AND_SAMPLES.md` for the full capability matrix and aggregation-pipeline templates.

#### Vendor notes: TigerGraph

- TigerGraph connection parameters can also be supplied via environment variables (`TIGERGRAPH_GSQL_PORT`, `TIGERGRAPH_USERNAME`, `TIGERGRAPH_PASSWORD`) when no `--endpoint` is given; the `--endpoint` value is the REST++ endpoint (default `http://127.0.0.1:9000`), and the GSQL server port defaults to `14240` (override via `TIGERGRAPH_GSQL_PORT`), with default user/password `tigergraph`/`tigergraph`.
- A minimal local TigerGraph Community Edition for testing can be started with:

```bash
docker run -d -p 14022:22 -p 9000:9000 -p 14240:14240 --name benchmark-tigergraph --ulimit nofile=1000000:1000000 -t tigergraph/community:latest
```

- TigerGraph is modeled as a native property graph (`User` vertex type, `Friend` edge type) with pre-installed GSQL queries invoked over the REST++ API, rather than per-request query text.
- Most baseline/phase-1 families have a direct GSQL translation, and unlike Postgres/Mongo it natively supports the shortest-path/cycle family (`shortest_path`, `shortest_path_with_filter`, `all_shortest_paths_len`, `pattern_cycle`) as well as all four algorithm procedures (`algo_pagerank_summary`, `algo_max_flow_single_pair`, `algo_msf_summary`, `algo_harmonic_summary`) directly in GSQL.
- Vector/fulltext smoke queries and `entity_path_introspection` have no equivalent and are **always excluded** from the TigerGraph catalog.
- See `QUERY_EXPLANATIONS_AND_SAMPLES.md` for the full capability matrix and GSQL templates.

#### Multi-vendor runs and per-vendor comparison reports (UI)

The benchmark is designed to run the same workload against multiple vendors and then generate a pairwise comparison report.

Run each vendor into the same results directory (so it contains `Results-.../<vendor>/{meta.json,metrics.prom}`):

```bash
cargo run --release --bin benchmark -- run --vendor falkor --name small-readonly -p40 --mps 4000 --results-dir Results-YYMMDD-HH:MM
cargo run --release --bin benchmark -- run --vendor neo4j --name small-readonly -p40 --mps 4000 --results-dir Results-YYMMDD-HH:MM
cargo run --release --bin benchmark -- run --vendor memgraph --name small-readonly -p40 --mps 4000 --results-dir Results-YYMMDD-HH:MM
cargo run --release --bin benchmark -- run --vendor postgres --name small-readonly-postgres -p40 --mps 4000 --results-dir Results-YYMMDD-HH:MM
cargo run --release --bin benchmark -- run --vendor mongo --name small-readonly-mongo -p40 --mps 4000 --results-dir Results-YYMMDD-HH:MM
cargo run --release --bin benchmark -- run --vendor tigergraph --name small-readonly-tigergraph -p40 --mps 4000 --results-dir Results-YYMMDD-HH:MM
```

Aggregate into UI-ready JSON summaries:

```bash
cargo run --release --bin benchmark -- aggregate --results-dir Results-YYMMDD-HH:MM --out-dir ui/public/summaries
```

This produces:

- `ui/public/summaries/neo4j_vs_falkordb.json`
- `ui/public/summaries/memgraph_vs_falkordb.json`
- `ui/public/summaries/postgres_vs_falkordb.json`
- `ui/public/summaries/mongo_vs_falkordb.json`
- `ui/public/summaries/tigergraph_vs_falkordb.json`

AWS instance comparisons (e.g. Graviton vs Intel for FalkorDB runs stored under `aws-tests/`):

```bash
cargo run --release --bin benchmark -- aggregate-aws-tests --aws-tests-dir aws-tests --out-path ui/public/summaries/aws_tests_falkor_graviton_vs_intel.json
```

Open the UI:

```bash
cd ui && npm install && npm run dev
```

The comparison pages load only the relevant vendor pair:

- `/neo4j` compares Neo4j vs FalkorDB
- `/memgraph` compares Memgraph vs FalkorDB
- `/postgres` compares Postgres vs FalkorDB
- `/mongo` compares Mongo vs FalkorDB
- `/tigergraph` compares TigerGraph vs FalkorDB

#### Per-query latency tracking (for the "single" view)

- Workloads generated by `generate-queries` embed a stable `q_id` and a query catalog (mapping id → query name).
- During `run`, the benchmark exports per-query latency percentiles (P10..P99) into `metrics.prom` and the aggregator emits them under `result.histogram_for_type`.
- Important: if you change the query set/metrics, regenerate the workload file before running:

```bash
cargo run --release --bin benchmark -- generate-queries --dataset small -s1000000 --name small-readonly --write-ratio 0.0
```

#### Helper script

For convenience wrappers that load data, regenerate queries, run workloads, and aggregate UI summaries, see:

- `scripts/run_small_benchmark.sh`
- `scripts/run_medium_benchmark.sh`
- `scripts/run_large_benchmark.sh`

#### Query explanations and samples

For the maintained query catalog guide (including phase-1 additions and sample Cypher), see:

- `QUERY_EXPLANATIONS_AND_SAMPLES.md`

#### Simulation mode

Run a simulation to see that the benchmark itself can sustain a specific mps given a fixed latency on that hardware. For example, simulate 40 clients that send at 5000 messages per second with latency of one millisecond per call:

```bash
cargo run --release --bin benchmark run --vendor falkor --name small -p40 --mps 5000 --simulate 1
```

## Data

- The data is based on https://www.kaggle.com/datasets/wolfram77/graphs-snap-soc-pokec
- Licensed under https://creativecommons.org/licenses/by/4.0/

## FAQ

### System Requirements

**Q: What are the minimum system requirements?**
A: FalkorDB requires a Linux/Unix system with 4GB RAM minimum. For production environments, 16GB RAM is recommended.

### Installation & Setup

**Q: Can I run FalkorDB without Redis?**
A: No, FalkorDB requires Redis 6.2 or higher as it operates as a Redis module.

### Development

**Q: Which query language does FalkorDB use?**
A: FalkorDB uses the Cypher query language, similar to Neo4j, making migration straightforward.

### Data Management

**Q: Does FalkorDB support data persistence?**
A: Yes, through Redis persistence mechanisms (RDB/AOF). Additional persistence options are in development.

### Integration

**Q: Does FalkorDB support common programming languages?**
A: Yes — FalkorDB has a set of clients in all these programming languages and more; see official clients.

### Production Use

**Q: Is FalkorDB production-ready?**
A: Yes, FalkorDB is stable for production use, being a continuation of the battle-tested RedisGraph codebase.

### Troubleshooting

**Q: What should I do if I get "libgomp.so.1: cannot open shared object file"?**
A: Install OpenMP:

- Ubuntu: `apt-get install libgomp1`
- RHEL/CentOS: `yum install libgomp`
- OSX: `brew install libomp`

### Migration

**Q: Can I migrate from Neo4j to FalkorDB?**
A: Yes, FalkorDB supports the Cypher query language, making migration from Neo4j straightforward. Migration tools are in development.

## Grafana and Prometheus

- Accessing Grafana: http://localhost:3000
- Accessing Prometheus: http://localhost:9090
- Exported metrics and sample queries:

```promql
sum by (vendor, spawn_id) (rate(operations_total{vendor="falkor"}[1m]))
rate(redis_commands_processed_total{instance=~"redis-exporter:9121"}[1m])
redis_connected_clients{instance=~"redis-exporter:9121"}
topk(5, irate(redis_commands_total{instance=~"redis-exporter:9121"} [1m]))
redis_blocked_clients
redis_commands_total
redis_commands_failed_calls_total
redis_commands_latencies_usec_count
redis_commands_rejected_calls_total
redis_io_threaded_reads_processed
redis_io_threaded_writes_processed
redis_io_threads_active
redis_memory_max_bytes
redis_memory_used_bytes
redis_memory_used_peak_bytes
redis_memory_used_vm_total
# redis_process_id
```

(Per the source, `redis_process_id` is commented out.)

## About the repository (GitHub metadata)

- **Description:** "A benchmarking tool to evaluate and compare the performance of graph databases with customizable workloads and metrics."
- **Homepage:** benchmark.falkordb.com
- **Topics:** benchmark, falkordb, graph-database, performance
- **Resources:** Readme · MIT license · Code of conduct · Contributing · Security policy · Activity · Custom properties
- **Stars:** 14 · **Watchers:** 3 · **Forks:** 2
- **Issues:** 4 · **Pull requests:** 14
- **Default branch:** `master` · **Branches:** 20 · **Tags:** 10 · **Commits:** 551
- **Latest commit on the page:** dependabot[bot] — "chore(deps-dev): bump @types/node from 26.1.1 to 26.4.1 in /ui (#327)" (Sep 12, 2026, `e1cc455`)
- **Releases:** 9 total · latest `v2.7` — "report stats: n/σ/CV + example queries" (Jul 28, 2026) · + 8 more releases
- **Deployments:** 500+ · Preview: Oct 14, 2026 (most recent) · Production: Sep 12, 2026
- **Packages:** none published
- **Contributors:** 12
- **Languages:** Rust 63.3% · TypeScript 24.1% · Shell 7.6% · Python 3.5% · Just 0.7% · JavaScript 0.4% · CSS 0.4%

### Repository structure

- `.github/` — GitHub Actions workflows and automated dependency/action bumps.
- `.idea/` — JetBrains IDE config (present since the initial commit).
- `dashboards/` — Grafana dashboards; recent work adds multi-engine comparison support (up to 5 engines).
- `provisioning/` — Prometheus/Grafana provisioning configuration.
- `scripts/` — helper wrappers (`run_small_benchmark.sh`, `run_medium_benchmark.sh`, `run_large_benchmark.sh`), `download-neo4j.sh`, and vendor fix scripts.
- `src/` — the Rust benchmark crate (also hosts the `doc_examples.rs` doctest harness).
- `ui/` — TypeScript web dashboard (npm, dev server, production build, Playwright smoke test).
- `vendor/falkordb-rs/` — vendored FalkorDB Rust client (async response timeout disabled).
- `Cargo.toml` / `Cargo.lock` — Rust manifest and lockfile (TigerGraph vendor added; Redis crate bumped 1.6.0 → 1.7.0).
- `Justfile` — all build/lint/test/docs/coverage/UI recipes (`just --list`).
- `LICENSE` — MIT license.
- `QUERY_EXPLANATIONS_AND_SAMPLES.md` — maintained query catalog, capability matrix, and per-vendor templates (SQL/aggregation/GSQL).
- `codecov.yml` — Codecov configuration (≥ 90% patch coverage).
- `falkordb_csv_loader.py` — Python CSV data loader for FalkorDB.
- `generate_docker_compose.sh` — generates the Prometheus + Grafana docker compose.
- `queries-for-falkordb.txt`, `queries.jsonl` — query sets used by the benchmark.
- `queries_tooltip_documentation.md` — UI "Queries" tooltip documentation with Cypher samples.
- `readme.md` — the repository README.
- `rustfmt.toml` — Rust formatting config.
- `test_queries/` — test query files.
- `todo.md` — TODO notes.

## Key facts and numbers

- Headline percentiles (FalkorDB vs Neo4j, aggregate expansion): **p50 55.0 ms vs 577.5 ms (10.5x)** · **p90 108.0 ms vs 4784.1 ms (44.3x)** · **p99 136.2 ms vs 46923.8 ms (344.5x)**.
- FalkorDB claim: p99 response times stay **under 140 ms** even under extreme workloads, while competitors show multi-second latencies.
- Benchmarked vendors: falkor, falkor secondary (FALKOR_2), neo4j, memgraph, postgres, mongo, tigergraph — up to 5 engines in comparison UI.
- Run flags used in examples: `-p40` (40 parallel clients), `--mps 4000` (4000 messages per second); helper-script example overrides: `QUERIES_COUNT=25000`, `WRITE_RATIO=0.05`, `PARALLEL=10`, `MPS=3000`.
- Simulation example: 40 clients sending at 5000 messages per second with 1 ms latency per call.
- Workload sizes: 10,000,000 queries (`-s10000000`) or 1,000,000 queries (`-s1000000`); `--write-ratio 0.0` for read-only.
- Results directory format: `Results-YYMMDD-HH:MM`, per-vendor `{meta.json, metrics.prom}`.
- Default ports: FalkorDB 6379 (secondary example 6800) · Neo4j 7687 · Memgraph 17687 (endpoint example uses 7687) · Postgres 5432 · Mongo 27017 · TigerGraph 9000 (REST++) and 14240 (GSQL), ssh 14022 · Grafana 3000 · Prometheus 9090 · redis-exporter 9121.
- Vendor credentials/defaults in examples: Postgres `postgres/benchmark123`, database `postgres`; MongoDB database `benchmark`; TigerGraph `tigergraph/tigergraph`.
- Postgres test container: `postgres:16`; Mongo test container: `mongo:7`; TigerGraph test container: `tigergraph/community:latest`.
- Mongo `temporal_spatial_roundtrip` requires MongoDB 6.0+.
- System requirements: Ubuntu, Redis server, build-essential/cmake/m4/automake, libtool/autoconf/python3, libomp-dev/libssl-dev, pkg-config, Rust toolchain, SDKman, unzip/zip. (FAQ: 4GB RAM minimum; 16GB recommended for production; Redis 6.2+ required.)
- Patch coverage gate: **≥ 90%** (codecov.yml).
- Data source: Kaggle SNAP soc-pokec dataset, CC BY 4.0 license.
- Repo stats: 14 stars · 3 watchers · 2 forks · 4 issues · 14 PRs · 551 commits · 20 branches · 10 tags · 9 releases · 500+ deployments · 12 contributors · 0 packages.
- Languages: Rust 63.3% · TypeScript 24.1% · Shell 7.6% · Python 3.5% · Just 0.7% · JavaScript 0.4% · CSS 0.4%.
- Latest release v2.7 (Jul 28, 2026); latest commit Sep 12, 2026 (`e1cc455`); deployments Preview Oct 14, 2026 / Production Sep 12, 2026.

## Code, commands and queries

Consolidated quick reference of the repository's commands (each also appears with context in the sections above).

### Helper scripts

```bash
./scripts/run_small_benchmark.sh
./scripts/run_medium_benchmark.sh
./scripts/run_large_benchmark.sh
RUN_FALKOR=1 RUN_FALKOR_2=1 RUN_NEO4J=0 RUN_MEMGRAPH=0 ./scripts/run_medium_benchmark.sh
QUERIES_COUNT=25000 WRITE_RATIO=0.05 PARALLEL=10 MPS=3000 ./scripts/run_medium_benchmark.sh
FALKOR_ENDPOINT=falkor://127.0.0.1:6379 \
FALKOR_ENDPOINT_2=falkor://127.0.0.1:6800 \
NEO4J_ENDPOINT=neo4j://127.0.0.1:7687 \
MEMGRAPH_ENDPOINT=bolt://127.0.0.1:17687 \
./scripts/run_small_benchmark.sh
```

### Build from source

```bash
git clone --recurse-submodules -j8 https://github.com/FalkorDB/FalkorDB.git
sudo apt install build-essential cmake m4 automake libtool autoconf python3 libomp-dev libssl-dev
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
make
sudo apt install pkg-config -y
git clone git@github.com:FalkorDB/benchmark.git
cd benchmark
sdk env install
./scripts/download-neo4j.sh
cargo build --release
source <(./target/release/benchmark generate-auto-complete bash)
cp ~/FalkorDB/bin/linux-x64-release/src/falkordb.so .
```

### Development recipes

```bash
just build
just clippy
just test
just test-one query_builder
just ci
just doc-check
just doc-links
just doc-shell
just coverage
just coverage-html
just ui-install
just ui-lint
just ui-build
just ui-dev
just ui-smoke
```

### Prometheus + Grafana compose

```bash
./generate_docker_compose.sh
docker-compose up
```

### CLI: load

```bash
cargo run --release --bin benchmark -- load --vendor falkor -s small
cargo run --release --bin benchmark -- load --vendor neo4j -s small
cargo run --release --bin benchmark -- load --vendor memgraph -s small
cargo run --release --bin benchmark -- load --vendor postgres -s small
cargo run --release --bin benchmark -- load --vendor mongo -s small
cargo run --release --bin benchmark -- load --vendor tigergraph -s small
cargo run --release --bin benchmark -- load --vendor falkor -s small --endpoint falkor://127.0.0.1:6379
cargo run --release --bin benchmark -- load --vendor neo4j -s small --endpoint neo4j://neo4j:benchmark123@127.0.0.1:7687
cargo run --release --bin benchmark -- load --vendor memgraph -s small --endpoint bolt://127.0.0.1:7687
cargo run --release --bin benchmark -- load --vendor postgres -s small --endpoint postgres://postgres:benchmark123@127.0.0.1:5432/postgres
cargo run --release --bin benchmark -- load --vendor mongo -s small --endpoint mongodb://127.0.0.1:27017/benchmark
cargo run --release --bin benchmark -- load --vendor tigergraph -s small --endpoint http://127.0.0.1:9000
cargo run --release --bin benchmark -- load --vendor neo4j -s small --query-profile fixture-dependent
cargo run --release --bin benchmark -- load --vendor memgraph -s small --query-profile fixture-dependent
cargo run --release --bin benchmark -- load --vendor falkor -s small --query-profile fixture-dependent
```

### CLI: generate-queries

```bash
cargo run --release --bin benchmark -- generate-queries -s10000000 --dataset small --name=small-readonly --write-ratio 0.0
cargo run --release --bin benchmark -- generate-queries -s1000000 --dataset small --name=small-readonly --write-ratio 0.0
cargo run --release --bin benchmark -- generate-queries -s1000000 --dataset small --name=small-extended --write-ratio 0.0 --vendor neo4j --query-profile extended-core
cargo run --release --bin benchmark -- generate-queries -s1000000 --dataset small --name=small-fixtures --write-ratio 0.0 --vendor memgraph --query-profile fixture-dependent
cargo run --release --bin benchmark -- generate-queries -s1000000 --dataset small --name=small-readonly-postgres --write-ratio 0.0 --vendor postgres --query-profile baseline
cargo run --release --bin benchmark -- generate-queries -s1000000 --dataset small --name=small-readonly-mongo --write-ratio 0.0 --vendor mongo --query-profile baseline
cargo run --release --bin benchmark -- generate-queries -s1000000 --dataset small --name=small-readonly-tigergraph --write-ratio 0.0 --vendor tigergraph --query-profile baseline
```

### CLI: run

```bash
cargo run --release --bin benchmark run --vendor falkor --name small-readonly -p40 --mps 4000
cargo run --release --bin benchmark run --vendor neo4j --name small-readonly -p40 --mps 4000
cargo run --release --bin benchmark run --vendor memgraph --name small-readonly -p40 --mps 4000
cargo run --release --bin benchmark run --vendor postgres --name small-readonly-postgres -p40 --mps 4000
cargo run --release --bin benchmark run --vendor mongo --name small-readonly-mongo -p40 --mps 4000
cargo run --release --bin benchmark run --vendor tigergraph --name small-readonly-tigergraph -p40 --mps 4000
cargo run --release --bin benchmark run --vendor falkor --name small-readonly -p40 --mps 4000 --endpoint falkor://127.0.0.1:6379
cargo run --release --bin benchmark run --vendor neo4j --name small-readonly -p40 --mps 4000 --endpoint neo4j://neo4j:benchmark123@127.0.0.1:7687
cargo run --release --bin benchmark run --vendor memgraph --name small-readonly -p40 --mps 4000 --endpoint bolt://127.0.0.1:7687
cargo run --release --bin benchmark run --vendor postgres --name small-readonly-postgres -p40 --mps 4000 --endpoint postgres://postgres:benchmark123@127.0.0.1:5432/postgres
cargo run --release --bin benchmark run --vendor mongo --name small-readonly-mongo -p40 --mps 4000 --endpoint mongodb://127.0.0.1:27017/benchmark
cargo run --release --bin benchmark run --vendor tigergraph --name small-readonly-tigergraph -p40 --mps 4000 --endpoint http://127.0.0.1:9000
cargo run --release --bin benchmark run --vendor falkor --name small -p40 --mps 5000 --simulate 1
```

### Multi-vendor aggregation and UI

```bash
cargo run --release --bin benchmark -- run --vendor falkor --name small-readonly -p40 --mps 4000 --results-dir Results-YYMMDD-HH:MM
cargo run --release --bin benchmark -- run --vendor neo4j --name small-readonly -p40 --mps 4000 --results-dir Results-YYMMDD-HH:MM
cargo run --release --bin benchmark -- run --vendor memgraph --name small-readonly -p40 --mps 4000 --results-dir Results-YYMMDD-HH:MM
cargo run --release --bin benchmark -- run --vendor postgres --name small-readonly-postgres -p40 --mps 4000 --results-dir Results-YYMMDD-HH:MM
cargo run --release --bin benchmark -- run --vendor mongo --name small-readonly-mongo -p40 --mps 4000 --results-dir Results-YYMMDD-HH:MM
cargo run --release --bin benchmark -- run --vendor tigergraph --name small-readonly-tigergraph -p40 --mps 4000 --results-dir Results-YYMMDD-HH:MM
cargo run --release --bin benchmark -- aggregate --results-dir Results-YYMMDD-HH:MM --out-dir ui/public/summaries
cargo run --release --bin benchmark -- aggregate-aws-tests --aws-tests-dir aws-tests --out-path ui/public/summaries/aws_tests_falkor_graviton_vs_intel.json
cd ui && npm install && npm run dev
```

### Local vendor containers (for testing)

```bash
docker run --rm -d --name benchmark-postgres -e POSTGRES_PASSWORD=benchmark123 -p 5432:5432 postgres:16
docker run --rm -d --name benchmark-mongo -p 27017:27017 mongo:7
docker run -d -p 14022:22 -p 9000:9000 -p 14240:14240 --name benchmark-tigergraph --ulimit nofile=1000000:1000000 -t tigergraph/community:latest
```

## Hackathon relevance

- Reproduce the FalkorDB vs Neo4j numbers locally (or cite the published table) to justify FalkorDB as your context layer — the p99 344.5x gap is the strongest single stat for a pitch.
- The workload generator plus per-query latency tracking (P10..P99 in `metrics.prom`) can profile the exact query shapes your agent issues (entity expansion, multi-hop traversal) so you can tune Cypher for the latency budget.
- Push results to the UI summaries and show a live comparison page — a ready-made judge demo for the "connected data" track.
- For agent-memory and company-brain tracks, sustained mps numbers under read-only workloads show the graph keeps up as conversation history grows.
- MIT license and `just` recipes make the tool easy to extend or cite; helper scripts give a one-command "show it working" story during the hackathon.

## Related notes

- `blog-falkordb-vs-neo4j.md` — the published FalkorDB vs Neo4j performance benchmark write-up.
- `repo-falkordb.md` — the graph database repository this tool benchmarks.
- `transcript-falkordb-ama.md` — FalkorDB team AMA covering performance and architecture questions.
