import { DiagnosticMessage } from "..";
import { DiagnosticSeverity, Scope, SourceSpan } from "../common";
import { getTypeDisplayName, Type } from "../types/common";

export interface AnalyzeContext {
  onDiagnosticMessage?: (msg: DiagnosticMessage) => void;
}

export abstract class Node {
  private _valueType: Type | null = null;

  public abstract getChildren(): ReadonlyArray<Node>;

  public get valueType(): Type | null {
    return this._valueType;
  }

  public setupSymbols(scope: Scope, context: AnalyzeContext): Scope {
    for (const child of this.getChildren()) {
      child.setupSymbols(scope, context);
    }
    return scope;
  }

  public analyze(context: AnalyzeContext) {
    this._valueType = this.analyzeInternal(context);
  }

  protected abstract analyzeInternal(context: AnalyzeContext): Type | null;

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
      for (const child of node.getChildren()) {
        visit(child, indent + 1);
      }
    }

    visit(this, 0);

    return analyzeTree.join("\n");
  }

  public toString(): string {
    return (
      this.constructor.name +
      `[${this.span.start.index}..${this.span.stop.index}] ${
        this._valueType ? `(type: ${getTypeDisplayName(this._valueType)})` : ""
      }`
    );
  }
}
