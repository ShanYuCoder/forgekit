import {
  parse
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
import "./chunk-5FJGXQUD.js";
import "./chunk-UUJK4DN4.js";
import "./chunk-LR7OO32H.js";
import "./chunk-2CIWN54W.js";
import "./chunk-ISYFUMFO.js";
import "./chunk-QIM5FEP6.js";
import "./chunk-4ACYCIYX.js";
import {
  selectSvgElement
} from "./chunk-G4S7HRY5.js";
import {
  configureSvgSize
} from "./chunk-SSRHSMRV.js";
import {
  log
} from "./chunk-LRGJVJNJ.js";
import {
  __name
} from "./chunk-I6JKGIYH.js";
import "./chunk-VKOADPXH.js";
import "./chunk-EQCVQC35.js";

// node_modules/.pnpm/mermaid@11.17.2/node_modules/mermaid/dist/chunks/mermaid.core/infoDiagram-27XIBGKW.mjs
var parser = {
  parse: __name(async (input) => {
    const ast = await parse("info", input);
    log.debug(ast);
  }, "parse")
};
var DEFAULT_INFO_DB = {
  version: "11.17.2" + (true ? "" : "-tiny")
};
var getVersion = __name(() => DEFAULT_INFO_DB.version, "getVersion");
var db = {
  getVersion
};
var draw = __name((text, id, version) => {
  log.debug("rendering info diagram\n" + text);
  const svg = selectSvgElement(id);
  configureSvgSize(svg, 100, 400, true);
  const group = svg.append("g");
  group.append("text").attr("x", 100).attr("y", 40).attr("class", "version").attr("font-size", 32).style("text-anchor", "middle").text(`v${version}`);
}, "draw");
var renderer = { draw };
var diagram = {
  parser,
  db,
  renderer
};
export {
  diagram
};
//# sourceMappingURL=infoDiagram-27XIBGKW-QEMP67NO.js.map
