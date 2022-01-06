import { DiagnosticSeverity } from "../common";
import { Scope } from "../scope";
import { SourceSymbol } from "../symbols";
import { widenType } from "../typeSystem/core";
import { CompileContext } from "../common";
import { ExpressionNode } from "./expression";
import { StatementNode } from "./statements";
import { TokenNode } from "./token";

export enum VariableKind {
  Variable,
  Const,
}

export class VariableDeclarationNode extends StatementNode {
  public symbol: SourceSymbol;

  public setupScopes(scope: Scope, context: CompileContext) {
    if (scope.resolveLast(this.name.text) != null) {
      context.onDiagnosticMessage?.({
        message: `Cannot redeclare variable '${this.name.text}'`,
        severity: DiagnosticSeverity.Error,
        span: this.span,
      });
    }

    this.value.setupScopes(scope, context);
    this.scope = scope;
  }

  public resolveTypes(context: CompileContext) {
    this.value.resolveTypes(context);

    if (!this.value.valueType) {
      return;
    }

    this.valueType =
      this.kind === VariableKind.Const
        ? this.value.valueType
        : widenType(this.value.valueType);
  }

  constructor(
    public readonly kind: VariableKind,
    public readonly name: TokenNode,
    public readonly value: ExpressionNode
  ) {
    super([name, value]);
    this.symbol = new SourceSymbol(this.name.text, this);
  }
}
