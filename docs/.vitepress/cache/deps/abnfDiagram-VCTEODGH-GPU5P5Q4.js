import {
  db,
  getStyles,
  renderer
} from "./chunk-MJ4PXU6I.js";
import {
  populateCommonDb
} from "./chunk-3OQBMKIU.js";
import {
  MermaidParseError
} from "./chunk-XQFEN734.js";
import "./chunk-IR32WM5H.js";
import "./chunk-W25JJLTO.js";
import "./chunk-5TBNU6FG.js";
import "./chunk-W6K7HVZ3.js";
import "./chunk-ST7O7BI3.js";
import "./chunk-TMBJPNG3.js";
import "./chunk-3G2UGCMP.js";
import "./chunk-YMKIC3RJ.js";
import "./chunk-EQEAHY5N.js";
import {
  createRailroadAbnfServices
} from "./chunk-5FJGXQUD.js";
import "./chunk-UUJK4DN4.js";
import "./chunk-LR7OO32H.js";
import "./chunk-2CIWN54W.js";
import "./chunk-ISYFUMFO.js";
import "./chunk-QIM5FEP6.js";
import "./chunk-4ACYCIYX.js";
import "./chunk-G4S7HRY5.js";
import "./chunk-SSRHSMRV.js";
import {
  log
} from "./chunk-LRGJVJNJ.js";
import {
  __name
} from "./chunk-I6JKGIYH.js";
import "./chunk-VKOADPXH.js";
import "./chunk-EQCVQC35.js";

// node_modules/.pnpm/mermaid@11.17.2/node_modules/mermaid/dist/chunks/mermaid.core/abnfDiagram-VCTEODGH.mjs
var langiumParser = createRailroadAbnfServices().RailroadAbnf.parser.LangiumParser;
var transformAlternation = __name((alt) => {
  const alternatives = alt.alternatives.map(transformConcatenation);
  if (alternatives.length === 1) {
    return alternatives[0];
  }
  return {
    type: "choice",
    alternatives
  };
}, "transformAlternation");
var transformConcatenation = __name((concat) => {
  const elements = concat.elements.map(transformElement);
  if (elements.length === 1) {
    return elements[0];
  }
  return {
    type: "sequence",
    elements
  };
}, "transformConcatenation");
var parseRepeat = __name((repeat) => {
  if (repeat.includes("*")) {
    const [minStr, maxStr] = repeat.split("*");
    const min = minStr ? parseInt(minStr, 10) : 0;
    const max = maxStr ? parseInt(maxStr, 10) : Infinity;
    return { min, max };
  }
  const exact = parseInt(repeat, 10);
  return { min: exact, max: exact };
}, "parseRepeat");
var transformElement = __name((element) => {
  const inner = transformPrimary(element.primary);
  if (!element.repeat) {
    return inner;
  }
  const { min, max } = parseRepeat(element.repeat);
  if (min === 0 && max === 1) {
    return { type: "optional", element: inner };
  }
  return {
    type: "repetition",
    element: inner,
    min,
    max
  };
}, "transformElement");
var transformPrimary = __name((primary) => {
  switch (primary.$type) {
    case "AbnfStringLiteral":
      return {
        type: "terminal",
        value: primary.value
      };
    case "AbnfNumVal":
      return {
        type: "terminal",
        value: primary.value
      };
    case "AbnfRuleName":
      return {
        type: "nonterminal",
        name: primary.name
      };
    case "AbnfGroup":
      return transformAlternation(primary.element);
    case "AbnfOptionalGroup":
      return {
        type: "optional",
        element: transformAlternation(primary.element)
      };
    default:
      throw new Error(`Unsupported ABNF primary node: ${primary.$type}`);
  }
}, "transformPrimary");
var transformRule = __name((rule) => {
  return {
    name: rule.name,
    definition: transformAlternation(rule.definition)
  };
}, "transformRule");
var populateDb = __name((ast) => {
  populateCommonDb(ast, db);
  if (ast.title) {
    db.setTitle(ast.title);
  }
  ast.rules.map((rule) => db.addRule(transformRule(rule)));
}, "populateDb");
var parser = {
  parse: __name((input) => {
    db.clear();
    log.debug("[ABNF Parser] Starting Langium parse");
    const result = langiumParser.parse(input);
    if (result.lexerErrors.length > 0 || result.parserErrors.length > 0) {
      throw new MermaidParseError(result);
    }
    const ast = result.value;
    log.debug("[ABNF Parser] Parsed rules:", ast.rules.length);
    populateDb(ast);
    log.debug("[ABNF Parser] Parse complete");
  }, "parse"),
  parser: {
    yy: db
  }
};
var diagram = {
  parser,
  db,
  renderer,
  styles: getStyles
};
export {
  diagram
};
//# sourceMappingURL=abnfDiagram-VCTEODGH-GPU5P5Q4.js.map
