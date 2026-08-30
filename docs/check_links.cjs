const fs = require('fs');
const path = require('path');

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

const docsDir = '/home/vutv/workspace/forgekit/docs';
const mdFiles = getFiles(docsDir);
const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

let brokenLinks = [];

for (const file of mdFiles) {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    const linkText = match[1];
    let linkPath = match[2];
    
    // Ignore external and absolute links
    if (linkPath.startsWith('http') || linkPath.startsWith('#') || linkPath.startsWith('mailto:')) {
      continue;
    }
    
    // Remove query params and hashes
    linkPath = linkPath.split('?')[0].split('#')[0];
    
    if (!linkPath) continue;
    
    let targetPath;
    if (linkPath.startsWith('/')) {
       targetPath = path.join(docsDir, linkPath);
    } else {
       targetPath = path.resolve(path.dirname(file), linkPath);
    }
    
    let exists = false;
    if (fs.existsSync(targetPath)) exists = true;
    else if (fs.existsSync(targetPath + '.md')) exists = true;
    else if (fs.existsSync(path.join(targetPath, 'index.md'))) exists = true;
    else if (fs.existsSync(path.join(targetPath, 'README.md'))) exists = true;
    
    if (!exists) {
      brokenLinks.push({ file: path.relative(docsDir, file), text: linkText, link: match[2] });
    }
  }
}

console.log(JSON.stringify(brokenLinks, null, 2));
