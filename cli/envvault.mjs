#!/usr/bin/env node
/**
 * Env Vault command line and MCP bridge client.
 *
 * This script has no dependencies. It talks to the running Env Vault desktop
 * app through a loopback-only bridge that the user enables in
 * Settings > Developer. The bridge is protected by a random token stored in
 * bridge.json inside the Env Vault data directory and it only answers while
 * the vault is unlocked.
 */

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { homedir, platform } from "node:os";
import { join } from "node:path";
import process from "node:process";

const VERSION = "1.0.0";

function dataDirectory() {
  if (process.env.ENV_VAULT_DATA_DIR) return process.env.ENV_VAULT_DATA_DIR;
  if (platform() === "win32") {
    const base = process.env.LOCALAPPDATA || join(homedir(), "AppData", "Local");
    return join(base, "EnvVault");
  }
  if (platform() === "darwin") {
    return join(homedir(), "Library", "Application Support", "EnvVault");
  }
  return join(process.env.XDG_DATA_HOME || join(homedir(), ".local", "share"), "EnvVault");
}

async function readBridge() {
  const file = join(dataDirectory(), "bridge.json");
  if (!existsSync(file)) {
    throw new Error(
      "The Env Vault bridge is not running. Open Env Vault > Settings > Developer and turn the MCP bridge on."
    );
  }
  const raw = await readFile(file, "utf8");
  const parsed = JSON.parse(raw);
  if (!parsed.port || !parsed.token) {
    throw new Error("bridge.json is malformed. Restart the bridge from Env Vault settings.");
  }
  return parsed;
}

async function request(path) {
  const bridge = await readBridge();
  const url = `http://127.0.0.1:${bridge.port}${path}`;
  let response;
  try {
    response = await fetch(url, {
      headers: { authorization: `Bearer ${bridge.token}` },
    });
  } catch {
    throw new Error("Could not reach Env Vault. Is the application running?");
  }
  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }
  if (!response.ok) {
    const message = payload?.error?.message || `Request failed with status ${response.status}.`;
    const error = new Error(message);
    error.code = payload?.error?.code || `HTTP_${response.status}`;
    throw error;
  }
  return payload;
}

function print(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function findProject(projects, needle) {
  if (!needle) return undefined;
  const normalized = needle.toLowerCase();
  return (
    projects.find((project) => project.id === needle) ||
    projects.find((project) => project.name.toLowerCase() === normalized) ||
    projects.find((project) => project.name.toLowerCase().includes(normalized))
  );
}

function help() {
  process.stdout.write(`Env Vault CLI ${VERSION}

Usage:
  envvault status                 Show bridge and vault status
  envvault projects               List projects and environment files
  envvault keys <project>         List keys of every env file in a project
  envvault env <envId>            Print one environment file
  envvault export <project> <dir> Write the env files of a project to a folder
  envvault mcp                    Run as an MCP server over stdio
  envvault help                   Show this help

The bridge only works while Env Vault is running and the vault is unlocked.
`);
}

async function commandStatus() {
  print(await request("/v1/status"));
}

async function commandProjects() {
  const projects = await request("/v1/projects");
  if (!projects.length) {
    process.stdout.write("No projects yet.\n");
    return;
  }
  for (const project of projects) {
    process.stdout.write(`${project.name}  (${project.envs.length} env)\n`);
    for (const env of project.envs) {
      process.stdout.write(`  - ${env.filename}  ${env.keyCount} keys  id=${env.id}\n`);
    }
  }
}

async function commandKeys(needle) {
  const projects = await request("/v1/projects");
  const project = findProject(projects, needle);
  if (!project) throw new Error(`Project not found: ${needle}`);
  for (const env of project.envs) {
    process.stdout.write(`${env.filename}\n`);
    for (const key of env.keys) process.stdout.write(`  ${key}\n`);
  }
}

async function commandEnv(envId) {
  const payload = await request(`/v1/envs/${encodeURIComponent(envId)}`);
  process.stdout.write(payload.rawText.endsWith("\n") ? payload.rawText : `${payload.rawText}\n`);
}

async function commandExport(needle, directory) {
  const { mkdir, writeFile } = await import("node:fs/promises");
  const projects = await request("/v1/projects");
  const project = findProject(projects, needle);
  if (!project) throw new Error(`Project not found: ${needle}`);
  await mkdir(directory, { recursive: true });
  for (const env of project.envs) {
    const payload = await request(`/v1/envs/${encodeURIComponent(env.id)}`);
    const target = join(directory, payload.filename);
    await writeFile(target, payload.rawText, "utf8");
    process.stdout.write(`wrote ${target}\n`);
  }
}

/* ------------------------------------------------------------------ */
/* Minimal MCP server (JSON-RPC 2.0 over stdio)                       */
/* ------------------------------------------------------------------ */

const MCP_TOOLS = [
  {
    name: "envvault_status",
    description: "Report whether Env Vault is running, whether the vault is unlocked and how many projects it holds.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "envvault_list_projects",
    description: "List Env Vault projects with their environment files and the key names in each file. Values are never returned by this tool.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "envvault_get_env",
    description: "Return the full text of one environment file by its env id. Only use this after the user explicitly asked for the values.",
    inputSchema: {
      type: "object",
      properties: { envId: { type: "string", description: "The env id from envvault_list_projects." } },
      required: ["envId"],
      additionalProperties: false,
    },
  },
];

async function callTool(name, args) {
  switch (name) {
    case "envvault_status":
      return await request("/v1/status");
    case "envvault_list_projects":
      return await request("/v1/projects");
    case "envvault_get_env": {
      if (!args || typeof args.envId !== "string") throw new Error("envId is required.");
      return await request(`/v1/envs/${encodeURIComponent(args.envId)}`);
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function runMcp() {
  const send = (message) => process.stdout.write(`${JSON.stringify(message)}\n`);
  let buffer = "";
  process.stdin.setEncoding("utf8");
  for await (const chunk of process.stdin) {
    buffer += chunk;
    let index = buffer.indexOf("\n");
    while (index !== -1) {
      const line = buffer.slice(0, index).trim();
      buffer = buffer.slice(index + 1);
      index = buffer.indexOf("\n");
      if (!line) continue;
      let message;
      try {
        message = JSON.parse(line);
      } catch {
        send({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } });
        continue;
      }
      const { id, method, params } = message;
      if (method === "initialize") {
        send({
          jsonrpc: "2.0",
          id,
          result: {
            protocolVersion: params?.protocolVersion || "2024-11-05",
            capabilities: { tools: {} },
            serverInfo: { name: "env-vault", version: VERSION },
          },
        });
      } else if (method === "notifications/initialized" || method === "initialized") {
        continue;
      } else if (method === "tools/list") {
        send({ jsonrpc: "2.0", id, result: { tools: MCP_TOOLS } });
      } else if (method === "tools/call") {
        try {
          const value = await callTool(params?.name, params?.arguments);
          send({
            jsonrpc: "2.0",
            id,
            result: {
              content: [{ type: "text", text: JSON.stringify(value, null, 2) }],
              isError: false,
            },
          });
        } catch (error) {
          send({
            jsonrpc: "2.0",
            id,
            result: {
              content: [{ type: "text", text: error.message }],
              isError: true,
            },
          });
        }
      } else if (method === "ping") {
        send({ jsonrpc: "2.0", id, result: {} });
      } else if (id !== undefined) {
        send({ jsonrpc: "2.0", id, error: { code: -32601, message: `Method not found: ${method}` } });
      }
    }
  }
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  switch (command) {
    case "status":
      await commandStatus();
      break;
    case "projects":
      await commandProjects();
      break;
    case "keys":
      await commandKeys(rest[0]);
      break;
    case "env":
      if (!rest[0]) throw new Error("envvault env <envId>");
      await commandEnv(rest[0]);
      break;
    case "export":
      if (!rest[0] || !rest[1]) throw new Error("envvault export <project> <directory>");
      await commandExport(rest[0], rest[1]);
      break;
    case "mcp":
      await runMcp();
      break;
    case undefined:
    case "help":
    case "--help":
    case "-h":
      help();
      break;
    case "--version":
    case "-v":
      process.stdout.write(`${VERSION}\n`);
      break;
    default:
      process.stderr.write(`Unknown command: ${command}\n\n`);
      help();
      process.exitCode = 1;
  }
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
