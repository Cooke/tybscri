import { DiagnosticSeverity } from "../common";
import { Type } from "../types/common";
import { AnalyzeContext, Node } from "./base";
import { ExpressionNode } from "./expression";
import { TokenNode } from "./token";

export class IdentifierInvocationNode extends ExpressionNode {
  protected analyzeInternal(context: AnalyzeContext): Type | null {
    const potentialTargets = context.scope.all.filter(
      (x) => x.name === this.name.text
    );

    for (const t of potentialTargets) {
      t.analyze(context);
    }

    for (const arg of this.argumentList) {
      arg.analyze(context);
    }

    if (potentialTargets.length !== 1) {
      context.onDiagnosticMessage?.({
        message: `Several matched identifiers are currently not supported`,
        severity: DiagnosticSeverity.Error,
        span: this.name.span,
      });
      return null;
    }

    const target = potentialTargets[0];
    if (target.valueType?.kind !== "Func") {
      context.onDiagnosticMessage?.({
        message: `The expression cannot be invoked`,
        severity: DiagnosticSeverity.Error,
        span: this.name.span,
      });
      return null;
    }

    return target.valueType.returnType;
  }

  public getChildren(): readonly Node[] {
    return [this.name, ...this.argumentList];
  }

  constructor(
    public readonly name: TokenNode,
    public readonly argumentList: ExpressionNode[]
  ) {
    super();
  }
}
