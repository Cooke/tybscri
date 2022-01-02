import { DiagnosticMessage, Type } from "..";
import { Scope, SourceSpan } from "../common";

export interface AnalyzeContext {
  onDiagnosticMessage?: (msg: DiagnosticMessage) => void;
}

export abstract class Node {
  public get valueType(): Type | undefined {
    return undefined;
  }

  constructor(public readonly children: Node[]) {}

  public setupScopes(scope: Scope, context: AnalyzeContext) {
    for (const child of this.children) {
      child.setupScopes(scope, context);
    }
  }

  public analyze(context: AnalyzeContext) {
    for (const child of this.children) {
      child.analyze(context);
    }
  }

  public get span(): SourceSpan {
    const children = this.children;
    if (children.length === 0) {
      throw new Error("Invalid start property implementation");
    }

    return {
      start: children[0].span.start,
      stop: children[children.length - 1].span.stop,
    };
  }

  public toString(): string {
    return `${this.constructor.name}[${this.span.start.index}..${this.span.stop.index}]`;
  }
}
