import { FuncType } from "..";
import { DiagnosticSeverity } from "../common";
import { CompileContext } from "../common";
import { ExpressionNode } from "./expression";
import { LambdaLiteralNode } from "./lambdaLiteral";
import { TokenNode } from "./token";

export class InvocationNode extends ExpressionNode {
  public resolveTypes(context: CompileContext) {
    this.target.resolveTypes(context);

    if (!(this.target.valueType instanceof FuncType)) {
      context.onDiagnosticMessage?.({
        message: `The expression cannot be invoked`,
        severity: DiagnosticSeverity.Error,
        span: this.target.span,
      });
      return;
    }

    const args = [
      ...this.argumentList,
      ...(this.trailingLambda ? [this.trailingLambda] : []),
    ];
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      const parameter = this.target.valueType.parameters[i];
      const expectedType = parameter?.type;
      arg.resolveTypes(context, expectedType);

      if (!expectedType.isAssignableFrom(arg.valueType)) {
        context.onDiagnosticMessage?.({
          message: `Argument of type '${arg.valueType.displayName}' is not assignable to '${expectedType.displayName}'`,
          severity: DiagnosticSeverity.Error,
          span: arg.span,
        });
      }
    }

    this.valueType = this.target.valueType.returnType;
  }

  constructor(
    public readonly target: ExpressionNode,
    public readonly lparan: TokenNode | null,
    public readonly argumentList: ExpressionNode[],
    public readonly rparan: TokenNode | null,
    public readonly trailingLambda: LambdaLiteralNode | null
  ) {
    super([
      target,
      ...(lparan ? [lparan] : []),
      ...argumentList,
      ...(rparan ? [rparan] : []),
      ...(trailingLambda ? [trailingLambda] : []),
    ]);
  }
}
