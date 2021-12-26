import { DiagnosticMessage } from "..";
import { DiagnosticSeverity, SourceSpan } from "../common";
import { Type } from "../types/common";

export interface AnalyzeContext {
  onDiagnosticMessage?: (msg: DiagnosticMessage) => void;
}

export abstract class Node {
  private _analyzeState: "not-analyzed" | "analyzing" | "analyzed" =
    "not-analyzed";
  private _valueType: Type | null = null;

  public abstract getChildren(): ReadonlyArray<Node>;

  public get valueType(): Type | null {
    if (this._analyzeState != "analyzed") {
      throw new Error(
        "Value type cannot be accessed the node has been analyzed"
      );
    }

    return this._valueType;
  }

  public analyze(context: AnalyzeContext) {
    if (this._analyzeState === "analyzed") {
      return;
    }

    if (this._analyzeState === "analyzing") {
      context.onDiagnosticMessage?.({
        message: "Circular reference detected",
        severity: DiagnosticSeverity.Error,
        span: this.span,
      });
      return;
    }

    this._analyzeState = "analyzing";
    this._valueType = this.analyzeInternal(context);
    this._analyzeState = "analyzed";
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
    return this.constructor.name + `[${this.span.start}..${this.span.stop}]`;
  }
}
