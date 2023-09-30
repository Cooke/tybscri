import { CompileContext, DiagnosticSeverity } from "../common";
import { Scope } from "../scope";
import { SourceSymbol } from "../SourceSymbol";
import { Symbol } from "../Symbol";
import { neverType, nullType, unknownType, VoidType } from "../typeSystem";
import { Type, TypeParameter } from "../typeSystem/common";
import { FuncType } from "../typeSystem/FuncType";
import { UnionType } from "../typeSystem/UnionType";
import { Node } from "./base";
import { ExpressionNode } from "./expression";
import { FunctionNode } from "./function";
import { ReturnNode } from "./return";
import { StatementNode } from "./statements";
import { TokenNode } from "./token";
import { VariableDeclarationNode } from "./variableDeclaration";

export class LambdaLiteralNode extends ExpressionNode {
  private itParameterType: Type = unknownType;
  private itParameterSymbol: Symbol;

  public setupScopes(scope: Scope, context: CompileContext) {
    const hoistedScopeSymbols = this.statements
      .filter((x): x is FunctionNode => x instanceof FunctionNode)
      .reduce<Symbol[]>((p, c) => [...p, c.symbol], []);
    let blockScope = new Scope(
      scope,
      hoistedScopeSymbols.concat([this.itParameterSymbol])
    );

    for (const statement of this.statements) {
      statement.setupScopes(blockScope, context);

      if (statement instanceof VariableDeclarationNode) {
        blockScope = blockScope.withSymbols([statement.symbol]);
      }
    }

    this.scope = blockScope;
  }

  public resolveTypes(context: CompileContext, expectedType?: Type | null) {
    if (!expectedType || !(expectedType instanceof FuncType)) {
      context.onDiagnosticMessage?.({
        message:
          "Lambda literals are currently only supported when a function type is expected",
        severity: DiagnosticSeverity.Error,
        span: this.span,
      });

      this.valueType = new FuncType([], unknownType);

      return;
    }

    this.itParameterType = expectedType.parameters[0]?.type ?? neverType;

    for (const stat of this.statements) {
      stat.resolveTypes(context);
    }

    const allReturns = this.statements.reduce<ReturnNode[]>(
      (p, c) => [...p, ...this.findReturns(c)],
      []
    );
    const returnType = UnionType.create(
      allReturns
        .map((x) => x.expression?.valueType ?? nullType)
        .concat([
          expectedType.returnType instanceof VoidType
            ? VoidType.instance
            : this.statements[this.statements.length - 1]?.valueType ??
              neverType,
        ])
    );

    if (
      !(expectedType.returnType instanceof TypeParameter) &&
      !expectedType.returnType.isAssignableFrom(returnType)
    ) {
      context.onDiagnosticMessage?.({
        message: `Return type '${returnType.displayName}' is not compatible with the expected return type '${expectedType.returnType.displayName}'`,
        span: this.span,
        severity: DiagnosticSeverity.Error,
      });
    }

    this.valueType = new FuncType(
      expectedType.parameters.map((x) => ({
        type: x.type,
        name: x.name,
      })),
      returnType
    );
  }

  private findReturns(node: Node): ReturnNode[] {
    if (node instanceof FunctionNode || node instanceof LambdaLiteralNode) {
      return [];
    }

    if (node instanceof ReturnNode) {
      return [node];
    }

    const returns: ReturnNode[] = [];
    for (const child of node.children) {
      returns.push(...this.findReturns(child));
    }

    return returns;
  }

  constructor(
    public readonly lcurl: TokenNode,
    public readonly statements: StatementNode[],
    public readonly rcurl: TokenNode
  ) {
    super([lcurl, ...statements, rcurl]);

    const valueTypeGetter = () => this.itParameterType;
    this.itParameterSymbol = new SourceSymbol("it", {
      resolveTypes: () => {},
      get valueType(): Type {
        return valueTypeGetter();
      },
      isConst: true,
    });
  }
}
