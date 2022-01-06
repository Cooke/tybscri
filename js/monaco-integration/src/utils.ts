import { Node } from "tybscri";
import { TokenNode } from "tybscri/lib/nodes/token";

export function findNonTokenNode(node: Node, offset: number): Node | null {
  if (offset < node.span.start.index || node.span.stop.index < offset) {
    return null;
  }

  if (node instanceof TokenNode) {
    return null;
  }

  for (const child of node.children) {
    const childResult = findNonTokenNode(child, offset);
    if (childResult) {
      return childResult;
    }
  }

  return node;
}
