#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const repoRoot = process.cwd();
const configPath = path.join(repoRoot, "scripts", "mf-remotes.json");
const shimRoot = path.join(repoRoot, ".mf-shim");

const readConfig = () => {
  if (process.env.MF_SHIM_MODULES) {
    return process.env.MF_SHIM_MODULES.split(",")
      .map((value) => value.trim())
      .filter(Boolean);
  }

  if (!fs.existsSync(configPath)) {
    return [];
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(configPath, "utf8"));
    return Array.isArray(parsed.modules) ? parsed.modules : [];
  } catch (error) {
    console.warn("[mf-shim] Failed to parse mf-remotes.json", error);
    return [];
  }
};

const modules = readConfig();

if (!modules.length) {
  process.exit(0);
}

const ensureShim = (specifier) => {
  const shimFile = path.join(shimRoot, ...specifier.split("/")) + ".js";
  fs.mkdirSync(path.dirname(shimFile), { recursive: true });

  const fileContents = `'use strict';
/**
 * Auto-generated shim for ${specifier}
 * Module Federation is disabled for this build. Set ENABLE_MF_PLUGIN=true to load live remotes.
 */
const DisabledRemote = () => {
  throw new Error('Module Federation remote "${specifier}" is masked by ensure-mf-shim.cjs');
};

module.exports = {
  __esModule: true,
  default: DisabledRemote,
};
`;

  fs.writeFileSync(shimFile, fileContents, "utf8");
};

modules.forEach(ensureShim);

console.log(`[mf-shim] Generated shims for ${modules.length} remote(s) in ${shimRoot}`);
