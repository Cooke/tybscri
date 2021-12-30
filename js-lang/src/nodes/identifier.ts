import { DiagnosticSeverity, NarrowedSymbol, Scope, Symbol } from "../common";
import { narrowTypeTruthy } from "../types/common";
import { AnalyzeContext } from "./base";
import { ExpressionNode } from "./expression";
import { TokenNode } from "./token";

export class IdentifierNode extends ExpressionNode {
  public symbol: Symbol | null = null;

  public get truthSymbols(): Symbol[] {
    return this.symbol
      ? [
          new NarrowedSymbol(this.symbol, () =>
            this.symbol?.valueType
              ? narrowTypeTruthy(this.symbol.valueType)
              : null
          ),
        ]
      : [];
  }

  public setupSymbols(scope: Scope, context: AnalyzeContext): Scope {
    this.symbol = scope.resolveLast(this.token.text);
    return scope;
  }

  protected analyzeInternal(context: AnalyzeContext) {
    if (!this.symbol) {
      context.onDiagnosticMessage?.({
        message: `Cannot find name '${this.token.text}'`,
        severity: DiagnosticSeverity.Error,
        span: this.token.span,
      });
      return null;
    }

    this.symbol.analyze(context);
    return this.symbol?.valueType ?? null;
  }

  constructor(public readonly token: TokenNode) {
    super();
    this.text = token.text;
  }

  public readonly text: string;

  public getChildren(): TokenNode[] {
    return [this.token];
  }
}
