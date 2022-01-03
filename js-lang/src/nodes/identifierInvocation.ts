import { DiagnosticSeverity } from "../common";
import { AnalyzeContext } from "./base";
import { ExpressionNode } from "./expression";
import { LambdaLiteralNode } from "./lambdaLiteral";
import { TokenNode } from "./token";

export class IdentifierInvocationNode extends ExpressionNode {
  public analyze(context: AnalyzeContext) {
    const potentialTargets = this.scope.resolveAll(this.name.text);

    for (const t of potentialTargets) {
      t.analyze(context);
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
    if (target.valueType.kind !== "Func") {
      context.onDiagnosticMessage?.({
        message: `The expression cannot be invoked`,
        severity: DiagnosticSeverity.Error,
        span: this.name.span,
      });
      return;
    }

    const args = [
      ...this.argumentList,
      ...(this.trailingLambda ? [this.trailingLambda] : []),
    ];
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      const expectedType = target.valueType.parameters[i]?.type;
      arg.analyze(context, expectedType);
    }

    this.valueType = target.valueType.returnType;
  }
  constructor(
    public readonly name: TokenNode,
    public readonly lparan: TokenNode | null,
    public readonly argumentList: ExpressionNode[],
    public readonly rparan: TokenNode | null,
    public readonly trailingLambda: LambdaLiteralNode | null
  ) {
    super([
      name,
      ...(lparan ? [lparan] : []),
      ...argumentList,
      ...(rparan ? [rparan] : []),
      ...(trailingLambda ? [trailingLambda] : []),
    ]);
  }
}
