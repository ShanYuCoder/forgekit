#!/usr/bin/env node

import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import * as path from 'node:path';
import * as fs from 'node:fs';

const rl = readline.createInterface({ input, output });

async function main() {
  console.log("=== Forgekit Unified Installer ===");
  console.log("Welcome to Forgekit. This tool will initialize MCP configuration, scripts, and agents for your project.");

  const types = ['Frontend', 'Backend', 'Fullstack', 'Document', 'Test'];
  console.log("\nSelect project type:");
  types.forEach((t, i) => console.log(`${i + 1}. ${t}`));
  
  let typeIndex = await rl.question("Choice (1-5): ");
  let selectedType = types[parseInt(typeIndex) - 1];

  while (!selectedType) {
    typeIndex = await rl.question("Invalid choice. Choice (1-5): ");
    selectedType = types[parseInt(typeIndex) - 1];
  }

  let feAdapter = '';
  let beAdapter = '';

  if (selectedType === 'Fullstack') {
    const fes = ['nuxt4', 'nextjs'];
    console.log("\nSelect Frontend technology:");
    fes.forEach((t, i) => console.log(`${i + 1}. ${t}`));
    
    let feIndex = await rl.question("Choice (1-2): ");
    feAdapter = fes[parseInt(feIndex) - 1];
    
    while (!feAdapter) {
      feIndex = await rl.question("Invalid choice. Choice (1-2): ");
      feAdapter = fes[parseInt(feIndex) - 1];
    }
    
    beAdapter = 'nestjs'; // Default for fullstack
    console.log(`\n=> Selected Fullstack: Frontend (${feAdapter}) + Backend (${beAdapter})`);
  } else if (selectedType === 'Frontend') {
     feAdapter = await rl.question("Enter Frontend technology (e.g. nuxt4, nextjs): ");
  } else if (selectedType === 'Backend') {
     beAdapter = await rl.question("Enter Backend technology (e.g. nestjs, fastapi, laravel, dotnet): ");
  }

  const agentsAns = await rl.question("\nDo you want to integrate Agents/Skills for Gemini and Antigravity? (Y/n): ");
  const installAgents = agentsAns.trim().toLowerCase() !== 'n';

  let feDocRoot = '';
  let feTestRoot = '';

  if (feAdapter) {
    console.log("\n--- Frontend Configuration ---");
    feDocRoot = await rl.question("Enter the root directory for Frontend documentation (default: docs/fe): ");
    if (!feDocRoot.trim()) feDocRoot = 'docs/fe';
    
    feTestRoot = await rl.question("Enter the root directory for Frontend tests (default: tests/fe): ");
    if (!feTestRoot.trim()) feTestRoot = 'tests/fe';
  }

  console.log("\n=== Installation Plan ===");
  console.log(`- Project Type: ${selectedType}`);
  if (feAdapter) {
    console.log(`- Frontend Adapter: ${feAdapter}`);
    console.log(`  * Docs Root: ${feDocRoot}`);
    console.log(`  * Tests Root: ${feTestRoot}`);
  }
  if (beAdapter) console.log(`- Backend Adapter: ${beAdapter}`);
  console.log(`- Setup Agents: ${installAgents ? 'Yes' : 'No'}`);
  console.log(`- Destination folder: .forgekit/`);

  const confirm = await rl.question("\nProceed with initialization? (Y/n): ");
  if (confirm.trim().toLowerCase() === 'n') {
    console.log("Cancelled.");
    rl.close();
    return;
  }

  console.log("\n[INFO] Initializing .forgekit folder...");
  const targetDir = path.join(process.cwd(), '.forgekit');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const projectConfig = {
    type: selectedType,
    frontend: feAdapter ? {
      adapter: feAdapter,
      docsRoot: feDocRoot,
      testsRoot: feTestRoot
    } : null,
    backend: beAdapter ? {
      adapter: beAdapter
    } : null
  };
  fs.writeFileSync(path.join(targetDir, 'config.json'), JSON.stringify(projectConfig, null, 2));
  console.log("  + Wrote config.json");

  const forgekitRoot = path.resolve(new URL(import.meta.url).pathname, '../../');
  
  const copyRecursive = (srcDir, destDir) => {
    if (!fs.existsSync(srcDir)) return;
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    const items = fs.readdirSync(srcDir, { withFileTypes: true });
    for (const item of items) {
      const srcPath = path.join(srcDir, item.name);
      const destPath = path.join(destDir, item.name);
      if (item.isDirectory()) {
        copyRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
        console.log(`  + Copied ${item.name}`);
      }
    }
  };

  if (feAdapter) {
    console.log(`[INFO] Syncing Frontend adapter (${feAdapter})...`);
    copyRecursive(path.join(forgekitRoot, 'adapters', feAdapter), targetDir);
  }
  if (beAdapter) {
    console.log(`[INFO] Syncing Backend adapter (${beAdapter})...`);
    copyRecursive(path.join(forgekitRoot, 'adapters', beAdapter), targetDir);
  }

  // Copy shared templates and schemas
  console.log(`[INFO] Syncing global templates & schemas...`);
  copyRecursive(path.join(forgekitRoot, 'templates'), path.join(targetDir, 'templates'));
  copyRecursive(path.join(forgekitRoot, 'schemas'), path.join(targetDir, 'schemas'));
  
  if (installAgents) {
    console.log("[INFO] Initializing .agents folder...");
    const agentsDir = path.join(process.cwd(), '.agents');
    if (!fs.existsSync(agentsDir)) {
      fs.mkdirSync(agentsDir, { recursive: true });
    }
    
    console.log("  + Syncing Skills (Harness)...");
    copyRecursive(path.join(forgekitRoot, 'harness'), path.join(agentsDir, 'skills'));

    // We create a sample mcp_config.json to wire the newly installed MCP Server
    const mcpConfig = {
      mcpServers: {
        forgekit: {
          command: "node",
          args: [path.join(forgekitRoot, 'bin', 'forgekit-mcp.mjs')]
        }
      }
    };
    fs.writeFileSync(
      path.join(agentsDir, 'mcp_config.json'), 
      JSON.stringify(mcpConfig, null, 2)
    );
    console.log("  + Wrote mcp_config.json");
  }

  console.log("\nSuccess! Forgekit is initialized for your project.");
  rl.close();
}

main().catch(err => {
  console.error(err);
  rl.close();
  process.exit(1);
});
