import { CompileContext, DiagnosticSeverity } from "../common";
import { bindType, FuncType, inferTypeArguments } from "../typeSystem";
import { ExpressionNode } from "./expression";
import { LambdaLiteralNode } from "./lambdaLiteral";
import { TokenNode } from "./token";

export class MemberInvocationNode extends ExpressionNode {
  public resolveTypes(context: CompileContext) {
    this.expression.resolveTypes(context);

    if (!this.expression.valueType) {
      // An error should be reported elsewhere
      return;
    }

    const members = this.expression.valueType.members;
    const matchingMembers = members.filter((x) => x.name === this.member.text);
    if (matchingMembers.length === 0) {
      context.onDiagnosticMessage?.({
        message: `No member with name '${this.member.text}' exists on type '${this.expression.valueType.displayName}'`,
        severity: DiagnosticSeverity.Error,
        span: this.member.span,
      });
      return;
    }

    if (matchingMembers.length > 1) {
      context.onDiagnosticMessage?.({
        message: `Ambiguous member '${this.member.text}' are currently not supported`,
        severity: DiagnosticSeverity.Error,
        span: this.member.span,
      });
      return;
    }

    if (matchingMembers.length === 0) {
      context.onDiagnosticMessage?.({
        message: `Unknown name '${this.member.text}'`,
        severity: DiagnosticSeverity.Error,
        span: this.member.span,
      });
      return;
    }

    const member = matchingMembers[0];
    if (!(member.type instanceof FuncType)) {
      context.onDiagnosticMessage?.({
        message: `The expression cannot be invoked`,
        severity: DiagnosticSeverity.Error,
        span: this.member.span,
      });
      return;
    }

    const args = [
      ...this.argumentList,
      ...(this.trailingLambda ? [this.trailingLambda] : []),
    ];
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      const expectedType = member.type.parameters[i]?.type;
      arg.resolveTypes(context, expectedType);
    }

    if (member.typeParameters && member.typeParameters.length > 0) {
      const typeAssignments = inferTypeArguments(
        member.type.parameters,
        args.map((x) => x.valueType)
      );

      this.valueType = bindType(member.type.returnType, typeAssignments);
      return;
    }

    this.valueType = member.type.returnType;
  }

  constructor(
    public readonly expression: ExpressionNode,
    public readonly member: TokenNode,
    public readonly lparan: TokenNode | null,
    public readonly argumentList: ExpressionNode[],
    public readonly rparan: TokenNode | null,
    public readonly trailingLambda: LambdaLiteralNode | null
  ) {
    super([
      expression,
      member,
      ...(lparan ? [lparan] : []),
      ...argumentList,
      ...(rparan ? [rparan] : []),
      ...(trailingLambda ? [trailingLambda] : []),
    ]);
  }
}
