import { DiagnosticSeverity } from "../common";
import { NarrowedSymbol, Symbol } from "../symbols";
import { Scope } from "../scope";
import { unknownType } from "../typeSystem";
import { narrowTypeTruthy } from "../typeSystem/core";
import { CompileContext } from "../common";
import { ExpressionNode } from "./expression";
import { TokenNode } from "./token";

export class IdentifierNode extends ExpressionNode {
  public symbol: Symbol | null = null;

  public createTruthNarrowedSymbols(): Symbol[] {
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

  public setupScopes(scope: Scope, context: CompileContext) {
    this.symbol = scope.resolveLast(this.token.text);
    this.scope = scope;
  }

  public analyze(context: CompileContext) {
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
