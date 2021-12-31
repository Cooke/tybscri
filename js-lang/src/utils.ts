import { Node } from "./nodes/base";

export function printTree(node: Node) {
  const analyzeTree: string[] = [];

  function appendLine(lineContent: string, indent: number) {
    let preIndent = "";
    for (let i = 0; i < indent; i++) {
      preIndent += "  ";
    }
    analyzeTree.push(preIndent + lineContent);
  }

  function visit(node: Node, indent: number) {
    appendLine(node.toString(), indent);
    for (const child of node.children) {
      visit(child, indent + 1);
    }
  }

  visit(node, 0);

  return analyzeTree.join("\n");
}
