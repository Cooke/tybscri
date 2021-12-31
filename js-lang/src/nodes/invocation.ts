import { DiagnosticSeverity } from "../common";
import { FuncType, Type } from "../types/common";
import { unknownType } from "../types/unknown";
import { AnalyzeContext, Node } from "./base";
import { ExpressionNode } from "./expression";

export class InvocationNode extends ExpressionNode {
  public analyze(context: AnalyzeContext) {
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
      return;
    }

    this.valueType = this.target.valueType.returnType;
  }

  constructor(
    public readonly target: ExpressionNode,
    public readonly argumentList: ExpressionNode[]
  ) {
    super([target, ...argumentList]);
  }
}
