import { DiagnosticSeverity } from "../common";
import { CompileContext } from "../common";
import { ExpressionNode } from "./expression";
import { TokenNode } from "./token";

export class MemberNode extends ExpressionNode {
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
        message: `Member overloading is currently not supported`,
        severity: DiagnosticSeverity.Error,
        span: this.member.span,
      });
      return;
    }

    this.valueType = matchingMembers[0].type;
  }

  constructor(
    public readonly expression: ExpressionNode,
    public readonly member: TokenNode
  ) {
    super([expression, member]);
  }
}
