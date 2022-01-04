import { DiagnosticSeverity } from "../common";
import { getAllTypeMembers, getTypeDisplayName } from "../types";
import { AnalyzeContext } from "./base";
import { ExpressionNode } from "./expression";
import { LambdaLiteralNode } from "./lambdaLiteral";
import { TokenNode } from "./token";

export class MemberInvocationNode extends ExpressionNode {
  public analyze(context: AnalyzeContext) {
    this.expression.analyze(context);

    if (!this.expression.valueType) {
      // An error should be reported elsewhere
      return;
    }

    const members = getAllTypeMembers(this.expression.valueType);
    const matchingMembers = members.filter((x) => x.name === this.member.text);
    if (matchingMembers.length === 0) {
      context.onDiagnosticMessage?.({
        message: `No member with name '${
          this.member.text
        }' exists on type '${getTypeDisplayName(this.expression.valueType)}'`,
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
    if (member.type.kind !== "Func") {
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
      arg.analyze(context, expectedType);
    }

    if (member.typeParameters && member.typeParameters.length > 0) {
      this.valueType = member.type;
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
