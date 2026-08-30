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
import {
  createRailroadServices
} from "./chunk-YMKIC3RJ.js";
import "./chunk-EQEAHY5N.js";
import "./chunk-5FJGXQUD.js";
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

// node_modules/.pnpm/mermaid@11.17.2/node_modules/mermaid/dist/chunks/mermaid.core/railroadDiagram-O6MQD6OU.mjs
var langiumParser = createRailroadServices().Railroad.parser.LangiumParser;
var transformExpression = __name((expr) => {
  switch (expr.$type) {
    case "RailroadTerminalExpr":
      return {
        type: "terminal",
        value: expr.value
      };
    case "RailroadNonTerminalExpr":
      return {
        type: "nonterminal",
        name: expr.name
      };
    case "RailroadSpecialExpr":
      return {
        type: "special",
        text: expr.text
      };
    case "RailroadSequenceExpr": {
      const elements = expr.elements.map(transformExpression);
      return elements.length === 1 ? elements[0] : { type: "sequence", elements };
    }
    case "RailroadChoiceExpr": {
      const alternatives = expr.alternatives.map(transformExpression);
      return alternatives.length === 1 ? alternatives[0] : { type: "choice", alternatives };
    }
    case "RailroadOptionalExpr":
      return {
        type: "optional",
        element: transformExpression(expr.element)
      };
    case "RailroadOneOrMoreExpr":
      return {
        type: "repetition",
        element: transformExpression(expr.element),
        min: 1,
        max: Infinity
      };
    case "RailroadZeroOrMoreExpr":
      return {
        type: "repetition",
        element: transformExpression(expr.element),
        min: 0,
        max: Infinity
      };
    default:
      throw new Error(`Unsupported railroad expression: ${expr.$type}`);
  }
}, "transformExpression");
var transformRule = __name((rule) => {
  return {
    name: rule.name,
    definition: transformExpression(rule.definition)
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
    log.debug("[Railroad Parser] Starting Langium parse");
    const result = langiumParser.parse(input);
    if (result.lexerErrors.length > 0 || result.parserErrors.length > 0) {
      throw new MermaidParseError(result);
    }
    const ast = result.value;
    log.debug("[Railroad Parser] Parsed rules:", ast.rules.length);
    populateDb(ast);
    log.debug("[Railroad Parser] Parse complete");
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
var railroadDiagram_default = diagram;
export {
  railroadDiagram_default as default,
  diagram
};
//# sourceMappingURL=railroadDiagram-O6MQD6OU-47RANQL6.js.map
