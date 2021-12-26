import { DiagnosticSeverity, Scope } from "../common";
import { AnalyzeContext } from "./base";
import { ExpressionNode } from "./expression";
import { TokenNode } from "./token";

export class IdentifierNode extends ExpressionNode {
  protected analyzeInternal(context: AnalyzeContext) {
    const symbols = this.scope.resolve(this.token.text);
    if (symbols.length === 0) {
      context.onDiagnosticMessage?.({
        message: `Cannot find name '${this.token.text}'`,
        severity: DiagnosticSeverity.Error,
        span: this.token.span,
      });
    }

    for (const sym of symbols) {
      sym.analyze(context);
    }

    if (symbols.length > 1) {
      context.onDiagnosticMessage?.({
        message: "Function overloading is currently not supported",
        severity: DiagnosticSeverity.Error,
        span: this.span,
      });
      return null;
    }

    return symbols[0]?.valueType ?? null;
  }

  constructor(public readonly token: TokenNode, public readonly scope: Scope) {
    super();
    this.text = token.text;
  }

  public readonly text: string | null;

  public getChildren(): TokenNode[] {
    return [this.token];
  }
}
