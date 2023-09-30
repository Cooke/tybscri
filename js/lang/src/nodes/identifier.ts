import { NarrowedSymbol } from "../NarrowedSymbol";
import { Symbol } from "../Symbol";
import { CompileContext, DiagnosticSeverity } from "../common";
import { Scope } from "../scope";
import { unknownType } from "../typeSystem";
import { narrowTypeTruthy } from "../typeSystem/utils";
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

  public resolveTypes(context: CompileContext) {
    if (!this.symbol) {
      context.onDiagnosticMessage?.({
        message: `Cannot find name '${this.token.text}'`,
        severity: DiagnosticSeverity.Error,
        span: this.token.span,
      });
      return;
    }

    this.symbol.resolveTypes(context);
    this.valueType = this.symbol.valueType;
  }

  constructor(public readonly token: TokenNode) {
    super([token]);
  }
}
