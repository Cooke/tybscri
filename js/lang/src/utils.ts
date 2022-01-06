import { Node } from "./nodes/base";
import { getTypeDisplayName, ObjectType } from "./typeSystem";

export function treeToString(node: Node) {
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

export function objectTypeToString(type: ObjectType) {
  return `${type.name}<${
    type.typeParameters
      ?.map(
        (tp, tpi) =>
          `${tp.variance ? tp.variance + " " : ""}${tp.name} ${
            type.typeArguments?.[tpi]
              ? `= ${getTypeDisplayName(type.typeArguments?.[tpi])}`
              : ""
          }`
      )
      .join(", ") ?? ""
  }>\n    ${type.members
    .map(
      (m) =>
        `${m.name}<${
          m.typeParameters?.map((tp) => `${tp.name}`).join(",") ?? ""
        }>: ${getTypeDisplayName(m.type)}`
    )
    .join("\n    ")}`;
}
