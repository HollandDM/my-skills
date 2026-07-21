#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const args = process.argv.slice(2);
const modelIndex = args.indexOf("--opencode-model");
const selectedOpenCodeModel = modelIndex === -1 ? null : args[modelIndex + 1];
const companionIndex = args.indexOf("--codex-companion");
const suppliedCompanion = companionIndex === -1 ? null : args[companionIndex + 1];

function run(command, commandArgs, timeout = 30000) {
  const result = spawnSync(command, commandArgs, {
    encoding: "utf8",
    timeout,
    maxBuffer: 4 * 1024 * 1024
  });
  return {
    ok: !result.error && result.status === 0,
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    error: result.error?.message ?? null
  };
}

function walkForCompanion(root, results) {
  let entries;
  try {
    entries = fs.readdirSync(root, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const entryPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      walkForCompanion(entryPath, results);
    } else if (entry.isFile() && entry.name === "codex-companion.mjs" && path.basename(path.dirname(entryPath)) === "scripts") {
      results.push(entryPath);
    }
  }
}

function findCompanion() {
  if (suppliedCompanion) {
    return fs.existsSync(suppliedCompanion) ? path.resolve(suppliedCompanion) : null;
  }
  const claudeRoot = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), ".claude");
  const candidates = [];
  walkForCompanion(path.join(claudeRoot, "plugins", "cache", "openai-codex", "codex"), candidates);
  walkForCompanion(path.join(claudeRoot, "plugins", "marketplaces", "openai-codex", "plugins", "codex"), candidates);
  return candidates.sort((left, right) => right.localeCompare(left, undefined, { numeric: true }))[0] ?? null;
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function cleanLines(text) {
  return text
    .replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

const companion = findCompanion();
const codexCheck = companion ? run("node", [companion, "setup", "--json"]) : null;
const codexReport = codexCheck ? parseJson(codexCheck.stdout) : null;
const opencodeCheck = selectedOpenCodeModel ? run("opencode", ["models"]) : null;
const opencodeModels = opencodeCheck ? cleanLines(opencodeCheck.stdout) : [];

const codexReady = codexReport?.ready === true;
const opencodeReady = Boolean(selectedOpenCodeModel) && opencodeCheck?.ok === true && opencodeModels.includes(selectedOpenCodeModel);
const status = codexReady && opencodeReady ? "SDD_READY" : "SDD_UNAVAILABLE";

console.log(JSON.stringify({
  status,
  codex: {
    companion,
    ready: codexReady,
    detail: codexReport ?? codexCheck
  },
  opencode: {
    selectedModel: selectedOpenCodeModel,
    ready: opencodeReady,
    availableModels: opencodeModels,
    detail: opencodeCheck && !opencodeCheck.ok ? opencodeCheck : null
  },
  nextAction: status === "SDD_READY"
    ? "Proceed with roster capability checks."
    : "Repair or install the failed dependency outside Mixed-Agent SDD, then rerun preflight."
}, null, 2));

process.exit(status === "SDD_READY" ? 0 : 1);
