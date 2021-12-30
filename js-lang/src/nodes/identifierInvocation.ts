import { DiagnosticSeverity, Scope } from "../common";
import { Type } from "../types/common";
import { AnalyzeContext, Node } from "./base";
import { ExpressionNode } from "./expression";
import { TokenNode } from "./token";

export class IdentifierInvocationNode extends ExpressionNode {
  scope = Scope.empty;

  public setupSymbols(scope: Scope, context: AnalyzeContext): Scope {
    this.scope = scope;
    return scope;
  }

  protected analyzeInternal(context: AnalyzeContext): Type | null {
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
      return null;
    }

    if (potentialTargets.length === 0) {
      context.onDiagnosticMessage?.({
        message: `Unknown name '${this.name.text}'`,
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
