import fs from 'node:fs';
import path from 'node:path';

function extractHex(colorStr) {
  const hexMatch = colorStr.match(/#([0-9a-fA-F]{3,6})/);
  return hexMatch ? hexMatch[0] : '#000000';
}

function parseSizeToPoint(pxStr) {
    const num = parseInt(pxStr.replace('px', ''), 10);
    return isNaN(num) ? 9 : Math.round(num * 0.75); // rough px to pt conversion
}

export function generate(visual, outputPath) {
  const { typography, colors, radius } = visual;
  
  let csCode = `// Auto-generated Design Tokens
using System.Drawing;

namespace App.UI
{
    public static class DesignTokens
    {
        public static class Colors
        {
`;
  if (colors) {
    if (colors.primary) csCode += `            public static readonly Color Primary = ColorTranslator.FromHtml("${extractHex(colors.primary)}");\n`;
    if (colors.secondary) csCode += `            public static readonly Color Secondary = ColorTranslator.FromHtml("${extractHex(colors.secondary)}");\n`;
    if (colors.background) csCode += `            public static readonly Color Background = ColorTranslator.FromHtml("${extractHex(colors.background)}");\n`;
  }
  
  csCode += `        }\n\n        public static class Typography\n        {\n`;
  
  if (typography) {
    const fontFamily = typography.fontFamily ? typography.fontFamily.split(',')[0].replace(/"/g, '') : "Arial";
    if (typography.baseFontSize) csCode += `            public static readonly Font BaseFont = new Font("${fontFamily}", ${parseSizeToPoint(typography.baseFontSize)}f);\n`;
    if (typography.heading1) csCode += `            public static readonly Font Heading1 = new Font("${fontFamily}", ${parseSizeToPoint(typography.heading1)}f, FontStyle.Bold);\n`;
  }
  
  csCode += `        }\n    }\n}\n`;

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, csCode);
  return true;
}
