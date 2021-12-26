import { DiagnosticSeverity } from "../common";
import { getAllTypeMembers, getTypeDisplayName, Type } from "../types/common";
import { AnalyzeContext } from "./base";
import { ExpressionNode } from "./expression";
import { TokenNode } from "./token";

export class MemberNode extends ExpressionNode {
  protected analyzeInternal(context: AnalyzeContext): Type | null {
    this.expression.analyze(context);
    if (!this.expression.valueType) {
      // An error should be reported elsewhere
      return null;
    }

    const members = getAllTypeMembers(this.expression.valueType);
    const matchingMembers = members.filter((x) => x.name === this.memberName);
    if (matchingMembers.length === 0) {
      context.onDiagnosticMessage?.({
        message: `No member with name '${
          this.memberName
        }' exists on type '${getTypeDisplayName(this.expression.valueType)}'`,
        severity: DiagnosticSeverity.Error,
        span: this.memberNameToken.span,
      });
      return null;
    }

    if (matchingMembers.length > 1) {
      context.onDiagnosticMessage?.({
        message: `Member overloading is currently not supported`,
        severity: DiagnosticSeverity.Error,
        span: this.memberNameToken.span,
      });
      return null;
    }

    return matchingMembers[0].type;
  }

  public getChildren() {
    return [this.expression, this.memberNameToken];
  }

  public get memberName() {
    return this.memberNameToken.text;
  }

  constructor(
    public readonly expression: ExpressionNode,
    public readonly memberNameToken: TokenNode
  ) {
    super();
  }
}
