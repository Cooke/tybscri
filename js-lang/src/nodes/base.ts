import { SourceSpan } from "../types";
import { Type } from "../types/common";

export abstract class Node {
  // public abstract visit<TReturn = undefined, TContext = undefined>(
  //   visitor: Visitor<TReturn, TContext>,
  //   context: TContext
  // ): TReturn;

  public abstract getChildren(): ReadonlyArray<Node>;

  public abstract get type(): Type | null | undefined;

  public get span(): SourceSpan {
    const children = this.getChildren();
    if (children.length === 0) {
      throw new Error("Invalid start property implementation");
    }

    return {
      start: children[0].span.start,
      stop: children[children.length - 1].span.stop,
    };
  }

  public toFullString() {
    const lines: string[] = [];

    function appendLine(lineContent: string, indent: number) {
      let preIndent = "";
      for (let i = 0; i < indent; i++) {
        preIndent += "  ";
      }
      lines.push(preIndent + lineContent);
    }

    function visit(node: Node, indent: number) {
      appendLine(node.toString(), indent);
      for (const child of node.getChildren()) {
        visit(child, indent + 1);
      }
    }

    visit(this, 0);

    return lines.join("\n");
  }

  public toString(): string {
    return this.constructor.name + `[${this.span.start}..${this.span.stop}]`;
  }
}
