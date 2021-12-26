import { DiagnosticSeverity, NarrowedSymbol, Scope, Symbol } from "../common";
import { narrowTypeTruthy } from "../types/common";
import { AnalyzeContext } from "./base";
import { ExpressionNode } from "./expression";
import { TokenNode } from "./token";

export class IdentifierNode extends ExpressionNode {
  private symbol: Symbol | null = null;

  public get truthSymbols(): Symbol[] {
    return [
      new NarrowedSymbol(this.symbol!, narrowTypeTruthy(this.valueType!)),
    ];
  }

  protected analyzeInternal(context: AnalyzeContext) {
    this.symbol = context.scope.resolve(this.token.text);
    if (!this.symbol) {
      context.onDiagnosticMessage?.({
        message: `Cannot find name '${this.token.text}'`,
        severity: DiagnosticSeverity.Error,
        span: this.token.span,
      });
      return null;
    }

    return this.symbol?.valueType ?? null;
  }

  constructor(public readonly token: TokenNode) {
    super();
    this.text = token.text;
  }

  public readonly text: string | null;

  public getChildren(): TokenNode[] {
    return [this.token];
  }
}
