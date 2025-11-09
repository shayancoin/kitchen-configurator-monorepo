#!/usr/bin/env node
import path from 'path';
import fs from 'fs';
import { promises as fsp } from 'fs';
import { globby } from 'globby';
import { parse } from '@babel/parser';
import traversePkg from '@babel/traverse';

const traverse = traversePkg.default || traversePkg;

const DEFAULT_PATTERNS = [
  'apps/**/*.{js,jsx,ts,tsx,mjs,cjs}',
  'packages/**/*.{js,jsx,ts,tsx,mjs,cjs}',
  'services/**/*.{js,jsx,ts,tsx,mjs,cjs}',
  'src/**/*.{js,jsx,ts,tsx,mjs,cjs}'
];
const IGNORE_PATTERNS = [
  '**/node_modules/**',
  '**/.turbo/**',
  '**/.next/**',
  '**/dist/**',
  '**/build/**',
  '**/out/**',
  '**/coverage/**'
];
const RESOLVE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: node tools/analysis/js_dag_analyzer.mjs <repo-path> [--patterns glob1 glob2 ...] [--max-files N] [--output file]');
    process.exit(1);
  }

  let repoPath = path.resolve(args[0]);
  let patterns = [...DEFAULT_PATTERNS];
  let maxFiles = null;
  let outputPath = null;

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--patterns') {
      const custom = [];
      i++;
      while (i < args.length && !args[i].startsWith('--')) {
        custom.push(args[i]);
        i++;
      }
      i--;
      if (custom.length) {
        patterns = custom;
      }
    } else if (arg === '--max-files') {
      maxFiles = Number(args[++i]);
    } else if (arg === '--output') {
      outputPath = args[++i];
    }
  }

  const files = await globby(patterns, {
    cwd: repoPath,
    absolute: true,
    gitignore: true,
    ignore: IGNORE_PATTERNS
  });

  const limitedFiles = typeof maxFiles === 'number' ? files.slice(0, maxFiles) : files;
  const graph = new Map();
  const exportStats = new Map();
  const errors = [];

  for (const absFile of limitedFiles) {
    const rel = toPosix(path.relative(repoPath, absFile));
    const deps = new Set();
    graph.set(rel, deps);

    let code;
    try {
      code = await fsp.readFile(absFile, 'utf8');
    } catch (err) {
      errors.push({ file: rel, reason: `read-failed: ${err.message}` });
      continue;
    }

    let ast;
    try {
      ast = parse(code, {
        sourceType: 'module',
        plugins: [
          'typescript',
          'jsx',
          'classProperties',
          'classPrivateProperties',
          'classPrivateMethods',
          'decorators-legacy',
          'dynamicImport',
          'importMeta'
        ]
      });
    } catch (err) {
      errors.push({ file: rel, reason: `parse-failed: ${err.message}` });
      continue;
    }

    const stat = {
      exports: 0,
      bodyCount: (ast.program && Array.isArray(ast.program.body)) ? ast.program.body.length : 0
    };

    traverse(ast, {
      ImportDeclaration(pathVisitor) {
        const value = pathVisitor.node.source && pathVisitor.node.source.value;
        if (!value || typeof value !== 'string') return;
        if (!value.startsWith('.') && !value.startsWith('/')) return;
        const resolved = resolveImport(absFile, value, repoPath);
        if (resolved) {
          deps.add(resolved);
        }
      },
      ExportNamedDeclaration(pathVisitor) {
        stat.exports += 1;
        const value = pathVisitor.node.source && pathVisitor.node.source.value;
        if (value && (value.startsWith('.') || value.startsWith('/'))) {
          const resolved = resolveImport(absFile, value, repoPath);
          if (resolved) {
            deps.add(resolved);
          }
        }
      },
      ExportAllDeclaration(pathVisitor) {
        stat.exports += 1;
        const value = pathVisitor.node.source && pathVisitor.node.source.value;
        if (value && (value.startsWith('.') || value.startsWith('/'))) {
          const resolved = resolveImport(absFile, value, repoPath);
          if (resolved) {
            deps.add(resolved);
          }
        }
      },
      ExportDefaultDeclaration() {
        stat.exports += 1;
      }
    });

    exportStats.set(rel, stat);
  }

  for (const deps of graph.values()) {
    for (const dep of deps) {
      if (!graph.has(dep)) {
        graph.set(dep, new Set());
        if (!exportStats.has(dep)) {
          exportStats.set(dep, { exports: 0, bodyCount: 0 });
        }
      }
    }
  }

  const topo = topoSort(graph);
  const depthInfo = topo.order.length ? computeDepth(graph, topo.order) : { depthMap: new Map(), maxDepth: 0 };
  const denseModules = Array.from(exportStats.entries())
    .map(([file, stat]) => ({
      file,
      exports: stat.exports,
      bodyCount: stat.bodyCount,
      density: stat.bodyCount === 0 ? (stat.exports > 0 ? 1 : 0) : Number((stat.exports / stat.bodyCount).toFixed(3))
    }))
    .filter((entry) => entry.density >= 0.5)
    .sort((a, b) => b.density - a.density || b.exports - a.exports)
    .slice(0, 20);

  const summary = {
    repoPath,
    analyzedFiles: limitedFiles.length,
    totalNodes: graph.size,
    totalEdges: countEdges(graph),
    maxDepth: depthInfo.maxDepth,
    topoOrderSample: topo.order.slice(0, 25),
    hasCycle: topo.hasCycle,
    denseModules,
    errors
  };

  if (outputPath) {
    const absOutput = path.isAbsolute(outputPath) ? outputPath : path.join(process.cwd(), outputPath);
    await fsp.mkdir(path.dirname(absOutput), { recursive: true });
    await fsp.writeFile(absOutput, JSON.stringify({ summary, topoOrder: topo.order }, null, 2));
  } else {
    console.log(JSON.stringify({ summary, topoOrder: topo.order }, null, 2));
  }
}

function topoSort(graph) {
  const indegree = new Map();
  for (const node of graph.keys()) {
    if (!indegree.has(node)) indegree.set(node, 0);
  }
  for (const [, deps] of graph.entries()) {
    for (const dep of deps) {
      indegree.set(dep, (indegree.get(dep) || 0) + 1);
    }
  }
  const queue = [];
  for (const [node, deg] of indegree.entries()) {
    if (deg === 0) queue.push(node);
  }
  const order = [];
  while (queue.length) {
    const node = queue.shift();
    order.push(node);
    for (const dep of graph.get(node) || []) {
      const next = (indegree.get(dep) || 0) - 1;
      indegree.set(dep, next);
      if (next === 0) {
        queue.push(dep);
      }
    }
  }
  const hasCycle = order.length !== graph.size;
  return { order, hasCycle };
}

function computeDepth(graph, topoOrder) {
  const depthMap = new Map();
  for (const node of topoOrder) {
    let maxDepth = 0;
    for (const dep of graph.get(node) || []) {
      const depDepth = depthMap.get(dep) || 0;
      if (depDepth > maxDepth) {
        maxDepth = depDepth;
      }
    }
    depthMap.set(node, maxDepth + 1);
  }
  let globalMax = 0;
  for (const value of depthMap.values()) {
    if (value > globalMax) globalMax = value;
  }
  return { depthMap, maxDepth: globalMax };
}

function countEdges(graph) {
  let total = 0;
  for (const deps of graph.values()) {
    total += deps.size;
  }
  return total;
}

function resolveImport(fromFile, importSource, repoRoot) {
  const fromDir = path.dirname(fromFile);
  const candidateBase = importSource.startsWith('/') ? path.join(repoRoot, importSource) : path.resolve(fromDir, importSource);

  for (const ext of ['', ...RESOLVE_EXTENSIONS]) {
    const candidate = ext ? candidateBase + ext : candidateBase;
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return toPosix(path.relative(repoRoot, candidate));
    }
  }

  for (const ext of RESOLVE_EXTENSIONS) {
    const candidate = path.join(candidateBase, 'index' + ext);
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return toPosix(path.relative(repoRoot, candidate));
    }
  }

  return null;
}

function toPosix(relativePath) {
  return relativePath.split(path.sep).join('/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
