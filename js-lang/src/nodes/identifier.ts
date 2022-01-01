import { DiagnosticSeverity, NarrowedSymbol, Scope, Symbol } from "../common";
import { narrowTypeTruthy, Type } from "../types/common";
import { unknownType } from "../types/unknown";
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
              : unknownType
          ),
        ]
      : [];
  }

  public setupScopes(scope: Scope, context: AnalyzeContext) {
    this.symbol = scope.resolveLast(this.token.text);
  }

  public analyze(context: AnalyzeContext) {
    if (!this.symbol) {
      context.onDiagnosticMessage?.({
        message: `Cannot find name '${this.token.text}'`,
        severity: DiagnosticSeverity.Error,
        span: this.token.span,
      });
      return;
    }

    this.symbol.analyze(context);
    this.valueType = this.symbol.valueType;
  }

  constructor(public readonly token: TokenNode) {
    super([token]);
  }
}