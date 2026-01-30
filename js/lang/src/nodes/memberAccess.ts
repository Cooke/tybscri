import { DiagnosticSeverity, ResolveContext } from "../common";
import { ExpressionNode } from "./expression";
import { TokenNode } from "./token";

export class MemberAccessNode extends ExpressionNode {
  public resolve(context: ResolveContext) {
    this.expression.resolve(context.withExpectedType(null));

    if (!this.expression.valueType) {
      // An error should be reported elsewhere
      return;
    }

    const members = this.expression.valueType.members;
    const matchingMembers = members.filter((x) => x.name === this.member.text);
    if (matchingMembers.length === 0) {
      context.compileContext.onDiagnosticMessage?.({
        message: `No member with name '${this.member.text}' exists on type '${this.expression.valueType.displayName}'`,
        severity: DiagnosticSeverity.Error,
        span: this.member.span,
      });
      return;
    }

    if (matchingMembers.length > 1) {
      context.compileContext.onDiagnosticMessage?.({
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
