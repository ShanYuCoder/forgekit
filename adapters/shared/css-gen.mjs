import fs from 'node:fs';
import path from 'node:path';
import yaml from 'yaml';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const args = process.argv.slice(2);
  // Default to shadcn for FE apps
  let adapterId = 'nextjs'; 
  let input = 'templates/product-skeleton/surfaces/common/yaml/design-system.bundle.yaml';
  let output = '';

  args.forEach(arg => {
    if (arg.startsWith('--adapter=')) adapterId = arg.split('=')[1];
    if (arg.startsWith('--in=')) input = arg.split('=')[1];
    if (arg.startsWith('--out=')) output = arg.split('=')[1];
  });

  const inputPath = path.resolve(process.cwd(), input);
  if (!fs.existsSync(inputPath)) {
    console.error(`Error: Input file not found at ${inputPath}`);
    process.exit(1);
  }

  const fileContents = fs.readFileSync(inputPath, 'utf8');
  let data;
  try {
    data = yaml.parse(fileContents);
  } catch (e) {
    console.error(`Error parsing YAML: ${e.message}`);
    process.exit(1);
  }

  const visual = data?.design?.visual;
  if (!visual) {
    console.error("Error: 'design.visual' section not found in YAML.");
    process.exit(1);
  }

  // Map adapter ID to the actual CSS generation script
  let cssAdapter = 'shadcn';
  if (adapterId === 'dotnet-line') {
    cssAdapter = 'winforms';
  } else if (adapterId === 'nextjs' || adapterId === 'nuxt4') {
    cssAdapter = 'shadcn';
  } else if (adapterId === 'shadcn' || adapterId === 'winforms') {
    cssAdapter = adapterId;
  } else {
     console.warn(`Warning: Unknown adapter '${adapterId}', falling back to shadcn.`);
     cssAdapter = 'shadcn';
  }

  const adapterPath = path.join(__dirname, 'css-adapters', `${cssAdapter}.mjs`);
  if (!fs.existsSync(adapterPath)) {
    console.error(`Error: Adapter implementation '${cssAdapter}' not found at ${adapterPath}`);
    process.exit(1);
  }

  const { generate } = await import(`file://${adapterPath}`);
  
  if (!output) {
    // Determine default output path based on adapter
    if (adapterId === 'nextjs') {
      output = 'app/globals.css';
    } else if (adapterId === 'nuxt4') {
      output = 'assets/css/main.css';
    } else if (adapterId === 'dotnet-line') {
      output = 'App.UI/DesignTokens.cs';
    } else {
      console.error("Error: --out parameter is required. Example: --out=app/globals.css");
      process.exit(1);
    }
  }

  const outputPath = path.resolve(process.cwd(), output);
  generate(visual, outputPath);
  
  console.log(`Successfully generated CSS rules using ${cssAdapter} adapter to ${outputPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
