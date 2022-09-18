import { Node } from "./nodes/base";
import { ObjectType } from "./typeSystem";

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
  if (type.typeParameters) {
    return `${type.name}<${
      type.typeParameters
        ?.map(
          (tp, tpi) =>
            `${tp.variance ? tp.variance + " " : ""}${tp.name} ${
              type.typeArguments?.[tpi]
                ? `= ${type.typeArguments?.[tpi].displayName}`
                : ""
            }`
        )
        .join(", ") ?? ""
    }>\n    ${type.members
      .map(
        (m) =>
          `${m.name}<${
            m.typeParameters?.map((tp) => `${tp.name}`).join(",") ?? ""
          }>: ${m.type.displayName}`
      )
      .join("\n    ")}`;
  }

  return `${type.name}\n    ${type.members
    .map(
      (m) =>
        `${m.name}<${
          m.typeParameters?.map((tp) => `${tp.name}`).join(",") ?? ""
        }>: ${m.type.displayName}`
    )
    .join("\n    ")}`;
}
