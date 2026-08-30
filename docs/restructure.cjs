const fs = require('fs');
const path = require('path');

const docsDir = '/home/vutv/workspace/forgekit/docs';

const dirsToCreate = [
  '1-guide', '2-lifecycle', '3-artifacts', '4-contracts', '5-testing', '6-reference', '7-architecture'
];

dirsToCreate.forEach(dir => {
  const fullPath = path.join(docsDir, dir);
  if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
});

const fileMap = {
  'platform/guide/start-now.md': '1-guide/getting-started.md',
  'platform/guide/toolkits.md': '1-guide/toolkits.md',
  'platform/guide/SYSTEM-DOC-STRUCTURE.md': '1-guide/system-doc-structure.md',
  'platform/guide/yaml-markdown-ai-workflow.md': '1-guide/ai-workflow.md',
  'platform/guide/team-ai-workflow-slides.md': '1-guide/team-ai-workflow-slides.md',
  'platform/guide/team-backend-phase3b-slides.md': '1-guide/team-backend-phase3b-slides.md',
  'platform/guide/e2e-automation-playwright.md': '5-testing/e2e-automation-playwright.md',
  
  'platform/toolchain/PIPELINE-AND-DESIGN.md': '2-lifecycle/overview.md',
  'platform/toolchain/DEVELOPMENT-FLOWS.md': '2-lifecycle/development-flows.md',
  'platform/toolchain/TEAM-AI-BACKEND-WORKFLOW.md': '2-lifecycle/backend-workflow.md',
  'platform/toolchain/QUALITY-AND-MAINTENANCE.md': '2-lifecycle/quality-maintenance.md',
  
  'platform/toolchain/FEATURE-ARTIFACT-LAYOUT.md': '3-artifacts/layout.md',
  'platform/toolchain/FEATURE-ARTIFACT-BUNDLE-IR.md': '3-artifacts/bundle-and-ir.md',
  'platform/toolchain/FEATURE-ARTIFACT-GRILL.md': '3-artifacts/grill-process.md',
  'platform/toolchain/PLATFORM-MARK.md': '3-artifacts/tags-and-markers.md',
  'platform/toolchain/DESIGN-REGISTRY-PROMOTION.md': '3-artifacts/design-registry-promotion.md',
  'platform/toolchain/UNIT-REGISTRY-PROMOTION.md': '3-artifacts/unit-registry-promotion.md',
  
  'platform/toolchain/CONTRACT-PORTAL-FAST.md': '4-contracts/portal-to-fastapi.md',
  'platform/toolchain/CONTRACT-FIELD-REGISTRY.md': '4-contracts/field-registry.md',
  
  'platform/toolchain/E2E-TESTIDS.md': '5-testing/e2e-testids.md',
  'platform/toolchain/E2E-SEMANTIC-UI-ASSERTIONS.md': '5-testing/e2e-assertions.md',
  
  'platform/toolchain/CLI-AND-COMMANDS.md': '6-reference/cli-and-commands.md',
  'platform/toolchain/PROMPT-TEMPLATES.md': '6-reference/prompt-templates.md',
  'platform/toolchain/REPO-SPLIT-MAP.md': '6-reference/repo-split-map.md',
  
  'platform/toolchain/PORTAL-ARCHITECTURE.md': '7-architecture/portal-architecture.md',
  'platform/toolchain/PAGE-LIFECYCLE.md': '7-architecture/page-lifecycle.md'
};

// Move files
for (const [oldPath, newPath] of Object.entries(fileMap)) {
  const fullOldPath = path.join(docsDir, oldPath);
  const fullNewPath = path.join(docsDir, newPath);
  if (fs.existsSync(fullOldPath)) {
    fs.renameSync(fullOldPath, fullNewPath);
  }
}

// Map for link replacement
const linkReplacements = {};

// Handle old -> new mappings
for (const [oldPath, newPath] of Object.entries(fileMap)) {
  const oldBase = path.basename(oldPath);
  linkReplacements[oldBase] = `/${newPath}`;
  if (oldBase.endsWith('.md')) {
    linkReplacements[oldBase.replace('.md', '')] = `/${newPath}`;
  }
}

// Virtual mappings
const virtualMappings = {
  'WIRE-PHASE-DIAGRAM': '/2-lifecycle/overview.md',
  'BACKEND-PHASE-DIAGRAM': '/2-lifecycle/overview.md',
  'UNIT-PHASE-DIAGRAM': '/2-lifecycle/overview.md',
  'TEST-PHASE-DIAGRAM': '/2-lifecycle/overview.md',
  'FULL-CYCLE-PIPELINE-DIAGRAM': '/2-lifecycle/overview.md',
  'DESIGN-PHASE-DIAGRAM': '/2-lifecycle/overview.md',
  'NEEDS-COMPONENT-FLOW': '/2-lifecycle/overview.md',
  'NEEDS-TEST-FLOW': '/2-lifecycle/overview.md',
  'NEEDS-UNIT-FLOW': '/2-lifecycle/overview.md',
  'FEATURE-ARTIFACT-LEGACY-DYNAMICS': '/2-lifecycle/overview.md',
  
  'UPDATE-SPEC-FLOW': '/2-lifecycle/quality-maintenance.md',
  'TECH-DEBT-FLOW': '/2-lifecycle/quality-maintenance.md',
  
  'PROJECT-MAPS': '/6-reference/repo-split-map.md',
  'factory-ai-stack': '/7-architecture/portal-architecture.md',
  'FLOW-login': '#',
  'index.md': '/'
};

for (const [virt, target] of Object.entries(virtualMappings)) {
  linkReplacements[virt] = target;
  if (!virt.endsWith('.md') && virt !== 'FLOW-login') {
    linkReplacements[virt + '.md'] = target;
  }
}

// Function to recursively get all md files
function getFiles(dir, files = []) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getFiles(filePath, files);
    } else if (filePath.endsWith('.md')) {
      files.push(filePath);
    }
  }
  return files;
}

const mdFiles = getFiles(docsDir);
const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

for (const file of mdFiles) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace links
  content = content.replace(linkRegex, (match, text, link) => {
    if (link.startsWith('http') || link.startsWith('#') || link.startsWith('mailto:')) return match;
    
    const [linkPath, hash] = link.split('#');
    const baseName = path.basename(linkPath);
    
    // Check if it's a known placeholder product surface
    if (linkPath.includes('product/surfaces')) {
      return `[${text}](#)`;
    }
    
    if (linkReplacements[baseName]) {
       // Convert to relative path
       const targetAbs = path.join(docsDir, linkReplacements[baseName]);
       let relPath = path.relative(path.dirname(file), targetAbs);
       if (!relPath.startsWith('.')) relPath = './' + relPath;
       // Clean up # if target is #
       if (linkReplacements[baseName] === '#') relPath = '#';
       return `[${text}](${relPath}${hash ? '#' + hash : ''})`;
    }
    
    // specific fix for Docs Home / README
    if (linkPath === '../index.md' || linkPath === './index.md') {
       let relPath = path.relative(path.dirname(file), docsDir);
       if (!relPath) relPath = '.';
       return `[${text}](${relPath}/)`;
    }

    return match;
  });

  fs.writeFileSync(file, content);
}

console.log('Restructuring completed');
