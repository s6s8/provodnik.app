#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const workDir = path.resolve(process.env.PROVODNIK_GRAPHIFY_DIR || '/tmp/provodnik-graphify');
const graphPath = path.join(workDir, 'graphify-out', 'graph.json');
const reportPath = path.join(workDir, 'graphify-out', 'GRAPH_REPORT.md');

const [, , command = 'help', ...args] = process.argv;

function printHelp() {
  console.log(`Provodnik Graphify wrapper

Usage:
  bun run graph:build
  bun run graph:status
  bun run graph:query -- "where are guide offers handled?"
  bun run graph:path -- "acceptOfferAction()" "createBooking()"
  bun run graph:affected -- "submitOfferAction" --depth 2
  bun run graph:explain -- "BidFormPanel()"
  bun run graph:report

Output:
  ${graphPath}

Env:
  PROVODNIK_GRAPHIFY_DIR=/custom/tmp/dir
`);
}

function run(commandName, commandArgs, options = {}) {
  const result = spawnSync(commandName, commandArgs, {
    cwd: repoRoot,
    stdio: 'inherit',
    env: process.env,
    ...options,
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function uvx(fromPackage, graphifyArgs) {
  run('uvx', ['--from', fromPackage, 'graphify', ...graphifyArgs]);
}

function requireGraph() {
  if (!existsSync(graphPath)) {
    console.error(`Missing graph: ${graphPath}`);
    console.error('Run: bun run graph:build');
    process.exit(1);
  }
}

function build() {
  rmSync(workDir, { recursive: true, force: true });
  mkdirSync(workDir, { recursive: true });

  uvx('graphifyy', [
    'extract',
    repoRoot,
    '--code-only',
    '--out',
    workDir,
    '--no-cluster',
  ]);

  uvx('graphifyy[leiden]', [
    'cluster-only',
    workDir,
    '--graph',
    graphPath,
    '--no-viz',
    '--no-label',
  ]);

  status();
}

function status() {
  requireGraph();
  const raw = JSON.parse(readFileSync(graphPath, 'utf8'));
  const edgeCount = Array.isArray(raw.links) ? raw.links.length : Array.isArray(raw.edges) ? raw.edges.length : 0;
  const nodeCount = Array.isArray(raw.nodes) ? raw.nodes.length : 0;
  const updatedAt = statSync(graphPath).mtime.toISOString();

  console.log(`Graph: ${graphPath}`);
  console.log(`Updated: ${updatedAt}`);
  console.log(`Nodes: ${nodeCount}`);
  console.log(`Edges: ${edgeCount}`);
  if (existsSync(reportPath)) {
    console.log(`Report: ${reportPath}`);
  }
}

function query() {
  requireGraph();
  if (args.length === 0) {
    console.error('Usage: bun run graph:query -- "question"');
    process.exit(1);
  }
  uvx('graphifyy', ['query', args[0], '--graph', graphPath, ...args.slice(1)]);
}

function pathBetween() {
  requireGraph();
  if (args.length < 2) {
    console.error('Usage: bun run graph:path -- "A" "B"');
    process.exit(1);
  }
  uvx('graphifyy', ['path', args[0], args[1], '--graph', graphPath, ...args.slice(2)]);
}

function affected() {
  requireGraph();
  if (args.length === 0) {
    console.error('Usage: bun run graph:affected -- "Symbol" [--depth 2]');
    process.exit(1);
  }
  uvx('graphifyy', ['affected', args[0], '--graph', graphPath, ...args.slice(1)]);
}

function explain() {
  requireGraph();
  if (args.length === 0) {
    console.error('Usage: bun run graph:explain -- "Symbol"');
    process.exit(1);
  }
  uvx('graphifyy', ['explain', args[0], '--graph', graphPath, ...args.slice(1)]);
}

function report() {
  requireGraph();
  if (!existsSync(reportPath)) {
    console.error(`Missing report: ${reportPath}`);
    process.exit(1);
  }
  console.log(readFileSync(reportPath, 'utf8'));
}

switch (command) {
  case 'build':
    build();
    break;
  case 'status':
    status();
    break;
  case 'query':
    query();
    break;
  case 'path':
    pathBetween();
    break;
  case 'affected':
    affected();
    break;
  case 'explain':
    explain();
    break;
  case 'report':
    report();
    break;
  case 'help':
  case '--help':
  case '-h':
    printHelp();
    break;
  default:
    console.error(`Unknown command: ${command}`);
    printHelp();
    process.exit(1);
}
