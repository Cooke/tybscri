import { SourceSymbol } from "../SourceSymbol";
import { CompileContext, DiagnosticSeverity, ResolveContext } from "../common";
import { Scope } from "../scope";
import { nullType, unknownType } from "../typeSystem";
import { FuncType } from "../typeSystem/FuncType";
import { UnionType } from "../typeSystem/UnionType";
import { Node } from "./base";
import { BlockNode } from "./block";
import { LambdaLiteralNode } from "./lambdaLiteral";
import { ReturnNode } from "./return";
import { StatementNode } from "./statements";
import { TokenNode } from "./token";
import { TypeNode } from "./type";

export class FunctionNode extends StatementNode {
  private _analyzeState: "not-analyzed" | "analyzing" | "analyzed" =
    "not-analyzed";

  public symbol: SourceSymbol;

  public readonly isConst = true;

  public setupScopes(scope: Scope, context: CompileContext) {
    for (const par of this.parameters) {
      par.setupScopes(scope, context);
    }

    this.returnType?.setupScopes(scope, context);

    this.body.setupScopes(
      new Scope(
        scope,
        this.parameters.map((x) => new SourceSymbol(x.name.text, x))
      ),
      context
    );

    this.scope = scope;
  }

  public resolve(context: ResolveContext) {
    if (this._analyzeState === "analyzed") {
      return;
    }

    if (this._analyzeState === "analyzing") {
      this._analyzeState = "analyzed";

      context.compileContext.onDiagnosticMessage?.({
        message: "Circular reference in function is currently not allowed",
        severity: DiagnosticSeverity.Error,
        span: this.span,
      });

      this.valueType = new FuncType(
        this.parameters.map((x) => ({
          type: x.type.type ?? unknownType,
          name: x.name.text,
        })),
        unknownType
      );
      return;
    }

    this._analyzeState = "analyzing";
    for (const par of this.parameters) {
      par.resolve(context.withExpectedType(null));
    }
    this.returnType?.resolve(context.withExpectedType(null));
    this.body.resolve(context.withExpectedType(null));

    if (this._analyzeState !== "analyzing") {
      // Analyzed already done in a circular analyze
      return;
    }

    const allReturns = this.findReturns(this.body);
    const actualReturnType = UnionType.create(
      allReturns
        .map((x) => x.expression?.valueType ?? nullType)
        .concat([this.body.valueType])
    );

    let returnType;
    if (this.returnType) {
      returnType = this.returnType.type;
      if (returnType && !returnType.isAssignableFrom(actualReturnType)) {
        context.compileContext.onDiagnosticMessage?.({
          message: `Return type '${actualReturnType.displayName}' is not compatible with the declared return type '${returnType.displayName}'`,
          severity: DiagnosticSeverity.Error,
          span: this.span,
        });
      }
    } else {
      returnType = actualReturnType;
    }

    this._analyzeState = "analyzed";
    this.valueType = new FuncType(
      this.parameters.map((x) => ({
        type: x.type.type ?? unknownType,
        name: x.name.text,
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
    public readonly name: TokenNode,
    public readonly parameters: FunctionParameterNode[],
    public readonly returnType: TypeNode | null,
    public readonly body: BlockNode
  ) {
    super([name, ...parameters, ...(returnType ? [returnType] : []), body]);
    this.symbol = new SourceSymbol(name.text, this);
  }
}

export class FunctionParameterNode extends Node {
  public get valueType() {
    return this.type.type;
  }

  constructor(
    public readonly name: TokenNode,
    public readonly colon: TokenNode,
    public readonly type: TypeNode,
    public readonly isConst: true = true
  ) {
    super([name, colon, type]);
  }
}
