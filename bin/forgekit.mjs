#!/usr/bin/env node

import { stdin as input, stdout as output } from 'node:process';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { intro, outro, select, multiselect, text, confirm as confirmPrompt, isCancel, cancel } from '@clack/prompts';
import pc from 'picocolors';

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('version') || args.includes('-v') || args.includes('--version')) {
    const pkgPath = path.resolve(new URL(import.meta.url).pathname, '../../package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    console.log(`Forgekit v${pkg.version}`);
    return;
  }

  const command = args[0];
  const engineCommands = ['split', 'merge', 'check', 'split_all', 'normalize', 'render', 'publish', 'legacy_validate', 'extract_i18n', 'openapi_render', 'openapi_build_ui', 'openapi_gen'];
  
  if (engineCommands.includes(command)) {
    try {
      const { runEngine } = await import('../dist/docs/cli/engines.js');
      const res = await runEngine(command, args.slice(1));
      if (res.stdout) console.log(res.stdout);
      if (res.stderr) console.error(pc.red(res.stderr));
      process.exit(res.code || 0);
    } catch (e) {
      console.error(pc.red('Engine execution failed: ' + e.message));
      process.exit(1);
    }
  }

  const testCommands = ['cases:render', 'cases:check', 'cases:coverage', 'tests:publish', 'testcase:gen', 'testcase:gen:dry', 'testcase:gen:all', 'e2e-registry'];
  if (testCommands.includes(command)) {
    try {
      const { runEngine } = await import('../dist/test/engines/run.js');
      const root = process.cwd();
      let engineRel = [];
      let argv = args.slice(1);
      
      if (command === 'cases:render') engineRel = ['cases', 'render-cases.mjs'];
      if (command === 'cases:check') engineRel = ['cases', 'check-plans.mjs'];
      if (command === 'cases:coverage') engineRel = ['cases', 'check-coverage.mjs'];
      if (command === 'tests:publish') engineRel = ['cases', 'publish.mjs'];
      if (command.startsWith('testcase:gen')) {
        engineRel = ['testcase', 'runners', 'generate.mjs'];
        if (command === 'testcase:gen:dry' && !argv.includes('--dry-run')) argv.push('--dry-run');
        if (command === 'testcase:gen:all' && !argv.includes('--all')) argv.push('--all');
      }
      if (command === 'e2e-registry') engineRel = ['testcase', 'runners', 'validate-registry.mjs'];

      const res = runEngine({ engineRel, projectRoot: root, argv });
      if (res.stdout) console.log(res.stdout);
      if (res.stderr) console.error(pc.red(res.stderr));
      process.exit(res.status || 0);
    } catch (e) {
      console.error(pc.red('Test engine execution failed: ' + e.message));
      process.exit(1);
    }
  }

  const codegenCommands = [
    'api-gen', 'api-gen:dry', 'api-registry', 'api-unit-gen', 'api-unit-gen:dry', 'api-unit-registry',
    'gen', 'gen:dry', 'registry', 'unit-gen', 'unit-gen:dry', 'unit-registry',
    'gen-common', 'gen-common:dry', 'gen-css', 'gen-css:dry', 'contract-gen', 'contract-gen:dry', 'contract-registry'
  ];
  
  if (codegenCommands.includes(command)) {
    try {
      const configPath = path.join(process.cwd(), '.forgekit', 'config.json');
      let config = {};
      if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      }
      const root = process.cwd();
      const argv = args.slice(1);
      const isDry = command.endsWith(':dry');
      
      const beAdapter = config.backend?.adapter || 'fastapi';
      const feAdapter = config.frontend?.adapter || 'nextjs';
      const docsRoot = config.frontend?.docsRoot;

      if (command.startsWith('api-')) {
        const { runBeEngine } = await import('../dist/codegen/adapters/run-be.js');
        const kindMap = {
          'api-gen': 'codegen', 'api-gen:dry': 'codegen', 'api-registry': 'registry',
          'api-unit-gen': 'unitgen', 'api-unit-gen:dry': 'unitgen', 'api-unit-registry': 'unit-registry'
        };
        const res = runBeEngine({ adapter: beAdapter, projectRoot: root, kind: kindMap[command], argv, dryRun: isDry });
        if (res.stdout) console.log(res.stdout);
        if (res.stderr) console.error(pc.red(res.stderr));
        process.exit(res.status || 0);
      } else if (command.startsWith('contract-')) {
        const { runContractEngine } = await import('../dist/codegen/adapters/run.js');
        const isRegistry = command === 'contract-registry';
        const res = runContractEngine({ projectRoot: root, docsRoot, argv, dryRun: isDry, registry: isRegistry });
        if (res.stdout) console.log(res.stdout);
        if (res.stderr) console.error(pc.red(res.stderr));
        process.exit(res.status || 0);
      } else if (command.startsWith('gen-common')) {
        const { runCommonGen } = await import('../dist/codegen/adapters/run.js');
        const res = runCommonGen({ adapter: feAdapter, projectRoot: root, docsRoot, argv, dryRun: isDry });
        if (res.stdout) console.log(res.stdout);
        if (res.stderr) console.error(pc.red(res.stderr));
        process.exit(res.status || 0);
      } else if (command.startsWith('gen-css')) {
        const { runCssGen } = await import('../dist/codegen/adapters/run.js');
        const res = runCssGen({ adapter: feAdapter, projectRoot: root, docsRoot, argv, dryRun: isDry });
        if (res.stdout) console.log(res.stdout);
        if (res.stderr) console.error(pc.red(res.stderr));
        process.exit(res.status || 0);
      } else {
        const { runAdapterEngine } = await import('../dist/codegen/adapters/run.js');
        const kindMap = {
          'gen': 'codegen', 'gen:dry': 'codegen', 'registry': 'codegen',
          'unit-gen': 'unitgen', 'unit-gen:dry': 'unitgen', 'unit-registry': 'unitgen'
        };
        const scriptMap = {
          'gen': 'generate.mjs', 'gen:dry': 'generate.mjs', 'registry': 'validate-registry.mjs',
          'unit-gen': 'generate.mjs', 'unit-gen:dry': 'generate.mjs', 'unit-registry': 'validate-registry.mjs'
        };
        const res = runAdapterEngine({ adapter: feAdapter, kind: kindMap[command], script: scriptMap[command], projectRoot: root, docsRoot, argv, dryRun: isDry });
        if (res.stdout) console.log(res.stdout);
        if (res.stderr) console.error(pc.red(res.stderr));
        process.exit(res.status || 0);
      }
    } catch (e) {
      console.error(pc.red('Codegen engine execution failed: ' + e.message));
      process.exit(1);
    }
  }

  if (command === 'dev' || command === 'serve') {
    const { spawn } = await import('node:child_process');
    const configPath = path.join(process.cwd(), '.forgekit', 'config.json');
    let docsRoot, testsRoot;
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      docsRoot = config.frontend?.docsRoot || config.backend?.docsRoot;
      testsRoot = config.frontend?.testsRoot;
    }
    if (docsRoot) {
      console.log(pc.blue(`[Docs] Starting VitePress in ${docsRoot}...`));
      spawn('npx', ['vitepress', 'dev', docsRoot, ...args.slice(1)], { stdio: 'inherit' });
    }
    if (testsRoot) {
      console.log(pc.blue(`[Tests] Starting VitePress in ${testsRoot} (Port 5174)...`));
      spawn('npx', ['vitepress', 'dev', testsRoot, '--port', '5174', ...args.slice(1)], { stdio: 'inherit' });
    }
    if (!docsRoot && !testsRoot) {
      spawn('npx', ['vitepress', 'dev', ...args.slice(1)], { stdio: 'inherit' });
    }
    // Keep alive for spawned processes
    setInterval(() => {}, 1000);
    return;
  }

  if (command === 'build') {
    const { spawnSync } = await import('node:child_process');
    const configPath = path.join(process.cwd(), '.forgekit', 'config.json');
    let docsRoot, testsRoot;
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      docsRoot = config.frontend?.docsRoot || config.backend?.docsRoot;
      testsRoot = config.frontend?.testsRoot;
    }
    if (docsRoot) {
      console.log(pc.blue(`[Docs] Building VitePress in ${docsRoot}...`));
      spawnSync('npx', ['vitepress', 'build', docsRoot, ...args.slice(1)], { stdio: 'inherit' });
    }
    if (testsRoot) {
      console.log(pc.blue(`[Tests] Building VitePress in ${testsRoot}...`));
      spawnSync('npx', ['vitepress', 'build', testsRoot, ...args.slice(1)], { stdio: 'inherit' });
    }
    if (!docsRoot && !testsRoot) {
      spawnSync('npx', ['vitepress', 'build', ...args.slice(1)], { stdio: 'inherit' });
    }
    return;
  }

  if (command === 'uninstall') {
    console.log(pc.yellow('Để gỡ cài đặt toàn cầu, vui lòng chạy: bash install.sh --uninstall'));
    console.log(pc.yellow('Hoặc nếu bạn cài đặt local: sh install-local.sh --uninstall'));
    process.exit(0);
  }

  if (command === 'deinit') {
    intro(pc.inverse(' === Forgekit Deinit === '));
    const confirm = await confirmPrompt({
      message: 'Bạn có chắc chắn muốn gỡ cài đặt Forgekit khỏi dự án này?',
      initialValue: false
    });
    if (isCancel(confirm) || !confirm) { cancel('Cancelled.'); process.exit(0); }

    const keepRegistry = await confirmPrompt({
      message: 'Giữ lại cấu hình và DSL Registry (.forgekit/config.json)? (Khuyến nghị CÓ để giữ cấu hình)',
      initialValue: true
    });

    const keepAgents = await confirmPrompt({
      message: 'Giữ lại thư mục Agent Skills (.agents, .gemini, .cursor)? (Để tận dụng cache)',
      initialValue: false
    });

    console.log(pc.blue('\n[INFO] Đang tiến hành gỡ bỏ...'));
    const targetDir = path.join(process.cwd(), '.forgekit');
    if (fs.existsSync(targetDir)) {
      if (keepRegistry && fs.existsSync(path.join(targetDir, 'config.json'))) {
        const items = fs.readdirSync(targetDir);
        for (const item of items) {
          if (item !== 'config.json') {
            fs.rmSync(path.join(targetDir, item), { recursive: true, force: true });
          }
        }
        console.log('  - Đã dọn dẹp .forgekit/ nhưng giữ lại config.json');
      } else {
        fs.rmSync(targetDir, { recursive: true, force: true });
        console.log('  - Đã xóa hoàn toàn thư mục .forgekit/');
      }
    }

    if (!keepAgents) {
      const dirs = ['.agents', '.gemini', '.cursor'];
      for (const d of dirs) {
        const p = path.join(process.cwd(), d);
        if (fs.existsSync(p)) {
          fs.rmSync(p, { recursive: true, force: true });
          console.log(`  - Đã xóa thư mục ${d}/`);
        }
      }
    } else {
      console.log('  - Đã bỏ qua bước xóa Agent Skills (giữ lại cache)');
    }

    const pkgPath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        if (pkg.scripts) {
          let modified = false;
          for (const key of Object.keys(pkg.scripts)) {
            if (key.startsWith('forge:')) {
              delete pkg.scripts[key];
              modified = true;
            }
          }
          if (modified) {
            fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
            console.log('  - Đã xóa các lệnh forge:* khỏi package.json');
          }
        }
      } catch (e) {}
    }

    outro(pc.green('Đã dọn dẹp Forgekit thành công!'));
    process.exit(0);
  }

  if (command && command !== 'init') {
    console.error(pc.red(`Lệnh không hợp lệ: ${command}`));
    console.log(`Chạy 'forgekit init' để bắt đầu hoặc xem tài liệu README.`);
    process.exit(1);
  }

  intro(pc.inverse(' === Forgekit Unified Installer === '));
  console.log(pc.gray("Welcome to Forgekit. This tool will initialize MCP configuration, scripts, and agents for your project.\n"));

  // 1. Agents
  const agentsAns = await multiselect({
    message: 'Select Agents/Skills to integrate:',
    options: [
      { value: 'gemini_antigravity', label: 'Gemini & Antigravity' },
      { value: 'cursor', label: 'Cursor' },
      { value: 'claude', label: 'Claude Code' },
      { value: 'codex', label: 'Codex CLI' },
      { value: 'opencode', label: 'opencode' },
      { value: 'hermes', label: 'Hermes Agent' },
      { value: 'kiro', label: 'Kiro' },
      { value: 'kilo', label: 'Kilo Code' }
    ],
    required: false
  });
  if (isCancel(agentsAns)) {
    cancel('Cancelled.');
    process.exit(0);
  }
  const selectedAgents = agentsAns;

  // 2. Project Type
  const selectedType = await select({
    message: 'Select project type:',
    options: [
      { value: 'Frontend', label: 'Frontend' },
      { value: 'Backend', label: 'Backend' },
      { value: 'Fullstack', label: 'Fullstack' },
      { value: 'Document', label: 'Document' },
      { value: 'Test', label: 'Test' }
    ],
    initialValue: 'Frontend'
  });
  if (isCancel(selectedType)) {
    cancel('Cancelled.');
    process.exit(0);
  }

  let feAdapter = '';
  let beAdapter = '';
  let feDocRoot = '';
  let feTestRoot = '';

  if (selectedType !== 'Document') {
    if (selectedType === 'Fullstack') {
      const feAns = await select({
        message: 'Select Frontend technology:',
        options: [
          { value: 'nuxt4', label: 'nuxt4' },
          { value: 'nextjs', label: 'nextjs' }
        ]
      });
      if (isCancel(feAns)) { cancel('Cancelled.'); process.exit(0); }
      feAdapter = feAns;
      beAdapter = 'nestjs';
      console.log(pc.cyan(`=> Selected Fullstack: Frontend (${feAdapter}) + Backend (${beAdapter})`));
    } else if (selectedType === 'Frontend') {
      const feAns = await text({
        message: 'Enter Frontend technology (e.g. nuxt4, nextjs):',
        placeholder: 'nuxt4'
      });
      if (isCancel(feAns)) { cancel('Cancelled.'); process.exit(0); }
      feAdapter = feAns || 'nuxt4';
    } else if (selectedType === 'Backend') {
      const beAns = await text({
        message: 'Enter Backend technology (e.g. nestjs, fastapi, laravel, dotnet):',
        placeholder: 'nestjs'
      });
      if (isCancel(beAns)) { cancel('Cancelled.'); process.exit(0); }
      beAdapter = beAns || 'nestjs';
    }

    // Document Root
    const docRootAns = await text({
      message: 'Enter the root directory for documentation:',
      placeholder: 'docs/fe',
      defaultValue: 'docs/fe'
    });
    if (isCancel(docRootAns)) { cancel('Cancelled.'); process.exit(0); }
    feDocRoot = docRootAns;

    // Test Root (only if FE)
    if (selectedType === 'Frontend' || selectedType === 'Fullstack') {
      const testRootAns = await text({
        message: 'Enter the root directory for Frontend tests:',
        placeholder: 'tests/fe',
        defaultValue: 'tests/fe'
      });
      if (isCancel(testRootAns)) { cancel('Cancelled.'); process.exit(0); }
      feTestRoot = testRootAns;
    }
  }

  console.log(pc.magenta("\n=== Installation Plan ==="));
  console.log(`- Project Type: ${selectedType}`);
  if (selectedType !== 'Document') {
    if (feAdapter) {
      console.log(`- Frontend Adapter: ${feAdapter}`);
      console.log(`  * Docs Root: ${feDocRoot}`);
      console.log(`  * Tests Root: ${feTestRoot}`);
    }
    if (beAdapter) {
      console.log(`- Backend Adapter: ${beAdapter}`);
      if (!feAdapter) console.log(`  * Docs Root: ${feDocRoot}`);
    }
  }
  console.log(`- Setup Agents: ${selectedAgents.length > 0 ? selectedAgents.join(', ') : 'No'}`);
  console.log(`- Destination folder: .forgekit/`);

  const confirm = await confirmPrompt({
    message: 'Proceed with initialization?',
    initialValue: true
  });
  if (isCancel(confirm) || !confirm) {
    cancel('Cancelled.');
    process.exit(0);
  }

  console.log(pc.blue("\n[INFO] Initializing .forgekit folder..."));
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
      adapter: beAdapter,
      docsRoot: (!feAdapter && feDocRoot) ? feDocRoot : undefined
    } : null
  };
  fs.writeFileSync(path.join(targetDir, 'config.json'), JSON.stringify(projectConfig, null, 2));
  console.log("  + Wrote config.json");

  const forgekitRoot = path.resolve(new URL(import.meta.url).pathname, '../../');
  
  const copyRecursive = (srcDir, destDir, log = false) => {
    if (!fs.existsSync(srcDir)) return;
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    const items = fs.readdirSync(srcDir, { withFileTypes: true });
    for (const item of items) {
      const srcPath = path.join(srcDir, item.name);
      const destPath = path.join(destDir, item.name);
      if (item.isDirectory()) {
        copyRecursive(srcPath, destPath, log);
      } else {
        fs.copyFileSync(srcPath, destPath);
        if (log) console.log(`  + Copied ${item.name}`);
      }
    }
  };

  if (feAdapter) {
    console.log(pc.blue(`[INFO] Syncing Frontend adapter (${feAdapter})...`));
    copyRecursive(path.join(forgekitRoot, 'adapters', feAdapter), targetDir);
  }
  if (beAdapter) {
    console.log(pc.blue(`[INFO] Syncing Backend adapter (${beAdapter})...`));
    copyRecursive(path.join(forgekitRoot, 'adapters', beAdapter), targetDir);
  }

  // Sync Vitepress configs for Docs / Testcases
  const vitepressDocsSource = path.join(forgekitRoot, 'engines', 'docs', 'vitepress');
  if (fs.existsSync(vitepressDocsSource)) {
    let destDocVp;
    let destDocsRoot;
    if (selectedType === 'Document') {
       destDocsRoot = process.cwd();
       destDocVp = path.join(process.cwd(), '.vitepress');
    } else if (feDocRoot) {
       destDocsRoot = path.join(process.cwd(), feDocRoot);
       destDocVp = path.join(process.cwd(), feDocRoot, '.vitepress');
    }
    if (destDocVp && destDocsRoot) {
       console.log(pc.blue(`  + Syncing .vitepress configs to ${path.relative(process.cwd(), destDocVp) || '.vitepress'}...`));
       copyRecursive(vitepressDocsSource, destDocVp);
       
       const baseDocsSource = path.join(forgekitRoot, 'templates', 'product-skeleton');
       if (fs.existsSync(baseDocsSource)) {
          console.log(pc.blue(`  + Initializing Base Docs Structure to ${path.relative(process.cwd(), destDocsRoot) || '.'}...`));
          if (!fs.existsSync(destDocsRoot)) fs.mkdirSync(destDocsRoot, { recursive: true });
          const items = fs.readdirSync(baseDocsSource, { withFileTypes: true });
          for (const item of items) {
             const srcPath = path.join(baseDocsSource, item.name);
             const destPath = path.join(destDocsRoot, item.name);
             if (!fs.existsSync(destPath)) {
                if (item.isDirectory()) {
                  copyRecursive(srcPath, destPath);
                } else {
                  fs.copyFileSync(srcPath, destPath);
                }
                console.log(`    - Created ${item.name}`);
             }
          }
       }
    }
  }

  const vitepressCasesSource = path.join(forgekitRoot, 'engines', 'cases', 'vitepress');
  if (fs.existsSync(vitepressCasesSource)) {
    let destCasesVp;
    if (selectedType === 'Test') {
       destCasesVp = path.join(process.cwd(), '.vitepress');
    } else if (feTestRoot && feTestRoot !== feDocRoot) {
       destCasesVp = path.join(process.cwd(), feTestRoot, '.vitepress');
    }
    if (destCasesVp) {
       console.log(pc.blue(`  + Syncing .vitepress configs for Testcases to ${path.relative(process.cwd(), destCasesVp) || '.vitepress'}...`));
       copyRecursive(vitepressCasesSource, destCasesVp);
    }
  }

  // Copy shared templates and schemas
  console.log(pc.blue(`[INFO] Syncing global templates & schemas...`));
  copyRecursive(path.join(forgekitRoot, 'templates'), path.join(targetDir, 'templates'));
  copyRecursive(path.join(forgekitRoot, 'schemas'), path.join(targetDir, 'schemas'));
  
  if (selectedAgents.length > 0) {
    console.log(pc.blue("[INFO] Initializing Agent Harnesses..."));
    
    for (const agent of selectedAgents) {
      let agentDir;
      if (agent === 'gemini_antigravity') {
        agentDir = path.join(process.cwd(), '.agents');
      } else {
        agentDir = path.join(process.cwd(), `.${agent}`);
      }

      if (!fs.existsSync(agentDir)) {
        fs.mkdirSync(agentDir, { recursive: true });
      }
      
      console.log(`  + Syncing Skills for ${agent}...`);
      
      // 1. Global Toolkits (platform-dna & artifactgraph)
      // These must be synced regardless of Project Type
      copyRecursive(path.join(forgekitRoot, 'harness', 'common'), agentDir);
      copyRecursive(path.join(forgekitRoot, 'harness', 'shared'), agentDir);

      // Toolkit 3: docskit (Only if Document project)
      if (selectedType === 'Document') {
        copyRecursive(path.join(forgekitRoot, 'harness', 'docs'), agentDir);
      }

      // Toolkit 4: testkit (Only for Test project)
      if (selectedType === 'Test') {
        copyRecursive(path.join(forgekitRoot, 'harness', 'tests'), agentDir);
      }

      // Toolkit 5: codegenkit (FE/BE logic)
      if (selectedType === 'Frontend' || selectedType === 'Fullstack') {
        const feHarness = path.join(forgekitRoot, 'harness', 'fe');
        if (fs.existsSync(feHarness)) {
          const items = fs.readdirSync(feHarness, { withFileTypes: true });
          for (const item of items) {
            if (item.name !== 'adapters') {
              copyRecursive(path.join(feHarness, item.name), path.join(agentDir, item.name));
            }
          }
        }
        if (feAdapter) {
          copyRecursive(path.join(feHarness, 'adapters', feAdapter), agentDir);
        }
      }

      if (selectedType === 'Backend' || selectedType === 'Fullstack') {
        const beHarness = path.join(forgekitRoot, 'harness', 'be');
        if (fs.existsSync(beHarness)) {
          const items = fs.readdirSync(beHarness, { withFileTypes: true });
          for (const item of items) {
            if (item.name !== 'adapters') {
              copyRecursive(path.join(beHarness, item.name), path.join(agentDir, item.name));
            }
          }
        }
        if (beAdapter) {
          copyRecursive(path.join(beHarness, 'adapters', beAdapter), agentDir);
        }
      }

      // We create a sample mcp_config.json for gemini_antigravity
      if (agent === 'gemini_antigravity') {
        const env = {};
        if (selectedType !== 'Document') {
          if (feDocRoot) {
            env.DOCSKIT_ROOT = path.resolve(feDocRoot);
            env.CODEGENKIT_DOCS_ROOT = path.resolve(feDocRoot);
            env.TESTKIT_DOCS_ROOT = path.resolve(feDocRoot);
          }
          if (feTestRoot) {
            env.TESTKIT_TESTS_ROOT = path.resolve(feTestRoot);
          }
        }
        if (feAdapter) {
          env.CODEGENKIT_ADAPTER = feAdapter;
          env.CODEGENKIT_TYPE = 'fe';
        }
        if (beAdapter) {
          env.CODEGENKIT_BE_ADAPTER = beAdapter;
          if (!feAdapter) {
             env.CODEGENKIT_ADAPTER = beAdapter;
             env.CODEGENKIT_TYPE = 'be';
          }
        }

        const mcpConfig = {
          mcpServers: {
            forgekit: {
              command: "node",
              args: [path.join(forgekitRoot, 'bin', 'forgekit-mcp.mjs')],
              env: Object.keys(env).length > 0 ? env : undefined
            }
          }
        };
        fs.writeFileSync(
          path.join(agentDir, 'mcp_config.json'), 
          JSON.stringify(mcpConfig, null, 2)
        );
        console.log(`  + Wrote mcp_config.json for ${agent}`);
      }
    }
  }

  const pkgPath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      pkg.scripts = pkg.scripts || {};
      pkg.devDependencies = pkg.devDependencies || {};

      if (selectedType === 'Document' || feDocRoot || feTestRoot || selectedType === 'Test') {
        pkg.devDependencies['vitepress'] = '^1.4.0';
        pkg.devDependencies['vitepress-plugin-mermaid'] = '^2.0.17';
        pkg.devDependencies['vitepress-mermaid-renderer'] = '^1.2.0';
        pkg.devDependencies['mermaid'] = '^11.17.2';
        pkg.devDependencies['dayjs'] = '^1.11.13';
        pkg.devDependencies['debug'] = '^4.3.4';
        pkg.devDependencies['cytoscape'] = '^3.30.3';
        pkg.devDependencies['cytoscape-cose-bilkent'] = '^4.1.0';
        pkg.devDependencies['@braintree/sanitize-url'] = '^7.1.0';
      }

      if (selectedType === 'Document') {
        pkg.scripts['forge:split'] = 'forgekit split';
        pkg.scripts['forge:split_all'] = 'forgekit split_all';
        pkg.scripts['forge:render'] = 'forgekit render';
        pkg.scripts['forge:openapi'] = 'forgekit openapi_render';
        pkg.scripts['forge:openapi-ui'] = 'forgekit openapi_build_ui';
        pkg.scripts['forge:dev'] = 'forgekit dev';
        pkg.scripts['forge:build'] = 'forgekit build';
        pkg.scripts['forge:publish'] = 'forgekit publish';
      }

      if (selectedType === 'Frontend' || selectedType === 'Fullstack') {
        pkg.scripts['forge:gen'] = 'forgekit gen';
        pkg.scripts['forge:unit'] = 'forgekit unit-gen';
        pkg.scripts['forge:css'] = 'forgekit gen-css';
      }

      if (selectedType === 'Backend' || selectedType === 'Fullstack') {
        pkg.scripts['forge:api-gen'] = 'forgekit api-gen';
        pkg.scripts['forge:api-unit'] = 'forgekit api-unit-gen';
        pkg.scripts['forge:openapi'] = 'forgekit openapi_render';
      }

      if (selectedType === 'Frontend' || selectedType === 'Backend' || selectedType === 'Fullstack') {
        pkg.scripts['forge:contract'] = 'forgekit contract-gen';
      }

      if (selectedType === 'Test') {
        pkg.scripts['forge:cases'] = 'forgekit cases:render';
        pkg.scripts['forge:cases-check'] = 'forgekit cases:check';
        pkg.scripts['forge:cases-cov'] = 'forgekit cases:coverage';
        pkg.scripts['forge:e2e-gen'] = 'forgekit testcase:gen';
        pkg.scripts['forge:e2e-reg'] = 'forgekit e2e-registry';
      }
      
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
      console.log(pc.blue('  + Injected forge:* scripts into package.json'));
    } catch (e) {
      console.log(pc.yellow('  ! Could not inject scripts into package.json'));
    }
  }

  console.log(pc.blue('\n[INFO] Khởi tạo bộ đệm (SQLite cache) cho ArtifactGraph...'));
  try {
    const { loadEffectiveRepoConfig } = await import('../dist/graph/config/load-config.js');
    const { IndexStore } = await import('../dist/graph/db/index-store.js');
    const { loadRegistries, indexRegistries } = await import('../dist/graph/registry/load-registries.js');
    const { indexLexicons } = await import('../dist/graph/lexicon/load-lexicon.js');

    const root = process.cwd();
    const cfg = loadEffectiveRepoConfig(root);
    const store = new IndexStore(root);
    store.transaction(() => {
      const loaded = loadRegistries(root, cfg);
      indexRegistries(store, loaded, root, cfg);
      indexLexicons(store, root, cfg);
    });
    store.close();
    console.log('  + Đã build SQLite cache thành công tại .forgekit/index.db');
  } catch (e) {
    console.log(pc.yellow('  ! Không thể khởi tạo SQLite cache (chưa có specs/registry): ' + e.message));
  }

  outro(pc.green("Success! Forgekit is initialized for your project."));
}

main().catch(err => {
  console.error(pc.red(err.message));
  process.exit(1);
});
