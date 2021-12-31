import { DiagnosticSeverity, Scope } from "../common";
import { Type } from "../types/common";
import { unknownType } from "../types/unknown";
import { AnalyzeContext, Node } from "./base";
import { ExpressionNode } from "./expression";
import { TokenNode } from "./token";

export class IdentifierInvocationNode extends ExpressionNode {
  private scope = Scope.empty;

  public setupScopes(scope: Scope, context: AnalyzeContext) {
    this.scope = scope;
  }

  public analyze(context: AnalyzeContext) {
    const potentialTargets = this.scope.resolveAll(this.name.text);

    for (const t of potentialTargets) {
      t.analyze(context);
    }

    for (const arg of this.argumentList) {
      arg.analyze(context);
    }

    if (potentialTargets.length > 1) {
      context.onDiagnosticMessage?.({
        message: `Ambiguous identifier '${this.name.text}' are currently not supported`,
        severity: DiagnosticSeverity.Error,
        span: this.name.span,
      });
      return;
    }

    if (potentialTargets.length === 0) {
      context.onDiagnosticMessage?.({
        message: `Unknown name '${this.name.text}'`,
        severity: DiagnosticSeverity.Error,
        span: this.name.span,
      });
      return;
    }

    const target = potentialTargets[0];
    if (target.valueType?.kind !== "Func") {
      context.onDiagnosticMessage?.({
        message: `The expression cannot be invoked`,
        severity: DiagnosticSeverity.Error,
        span: this.name.span,
      });
      return;
    }

    this.valueType = target.valueType.returnType;
  }
  constructor(
    public readonly name: TokenNode,
    public readonly argumentList: ExpressionNode[]
  ) {
    super([name, ...argumentList]);
  }
}
