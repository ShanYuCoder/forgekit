import fs from 'node:fs';
import path from 'node:path';
import yaml from 'yaml';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const args = process.argv.slice(2);
  let adapter = 'shadcn';
  let input = 'templates/product-skeleton/surfaces/common/yaml/design-system.bundle.yaml';
  let output = '';

  args.forEach(arg => {
    if (arg.startsWith('--adapter=')) adapter = arg.split('=')[1];
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

  const adapterPath = path.join(__dirname, 'adapters', `${adapter}.mjs`);
  if (!fs.existsSync(adapterPath)) {
    console.error(`Error: Adapter '${adapter}' not found at ${adapterPath}`);
    process.exit(1);
  }

  const { generate } = await import(`file://${adapterPath}`);
  
  if (!output) {
    console.error("Error: --out parameter is required. Example: --out=app/globals.css");
    process.exit(1);
  }

  const outputPath = path.resolve(process.cwd(), output);
  generate(visual, outputPath);
  
  console.log(`Successfully generated tokens using ${adapter} adapter to ${outputPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
