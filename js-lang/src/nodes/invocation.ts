import { DiagnosticSeverity } from "../common";
import { FuncType, Type } from "../types/common";
import { AnalyzeContext, Node } from "./base";
import { ExpressionNode } from "./expression";

export class InvocationNode extends ExpressionNode {
  protected analyzeInternal(context: AnalyzeContext): Type | null {
    this.target.analyze(context);
    for (const arg of this.argumentList) {
      arg.analyze(context);
    }

    if (this.target.valueType?.kind !== "Func") {
      context.onDiagnosticMessage?.({
        message: `The expression cannot be invoked`,
        severity: DiagnosticSeverity.Error,
        span: this.target.span,
      });
      return null;
    }

    return this.target.valueType.returnType;
  }

  public getChildren(): readonly Node[] {
    return [this.target, ...this.argumentList];
  }

  constructor(
    public readonly target: ExpressionNode,
    public readonly argumentList: ExpressionNode[]
  ) {
    super();
  }
}
