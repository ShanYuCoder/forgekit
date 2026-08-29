import fs from 'node:fs';
import path from 'node:path';

// If glob is not available, we can use a simpler recursive function, but since I can just write it:
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.ts')) results.push(file);
    }
  });
  return results;
}

const files = walk('/home/vutv/workspace/forgekit/src/modules');

let totalReplaced = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // The regex looks for server.tool('something' or server.tool("something"
  // and replaces it with server.tool('forge_something'
  
  // We need to be careful not to prefix if it's already prefixed, or prefix dynamically.
  // We'll replace all server.tool('name' -> server.tool('forge_name' 
  // For each module we can also add its name if not already there, but `forge_` is good enough.
  
  content = content.replace(/server\.tool\(\s*(['"])(forge_)([^'"]+)\1/g, (match, quote, prefix, toolName) => {
    return `server.tool(${quote}${toolName}${quote}`;
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated tools in ${file}`);
    totalReplaced++;
  }
});

console.log(`Done. Updated ${totalReplaced} files.`);
