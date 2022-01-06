import { DiagnosticSeverity } from "../common";
import { SourceSymbol } from "../symbols";
import { reduceUnionType } from "../typeSystem/core";
import { FuncType, Type, UnionType } from "../typeSystem/common";
import { nullType } from "../typeSystem";
import { unknownType } from "../typeSystem";
import { Node } from "./base";
import { CompileContext } from "../common";
import { BlockNode } from "./block";
import { ReturnNode } from "./return";
import { StatementNode } from "./statements";
import { TokenNode } from "./token";
import { TypeNode } from "./type";
import { LambdaLiteralNode } from "./lambdaLiteral";
import { Scope } from "../scope";

export class FunctionNode extends StatementNode {
  private _analyzeState: "not-analyzed" | "analyzing" | "analyzed" =
    "not-analyzed";

  public symbol: SourceSymbol;

  public setupScopes(scope: Scope, context: CompileContext) {
    for (const par of this.parameters) {
      par.setupScopes(scope, context);
    }

    this.body.setupScopes(
      new Scope(
        scope,
        this.parameters.map((x) => new SourceSymbol(x.name.text, x))
      ),
      context
    );

    this.scope = scope;
  }

  public analyze(context: CompileContext) {
    if (this._analyzeState === "analyzed") {
      return;
    }

    if (this._analyzeState === "analyzing") {
      this._analyzeState = "analyzed";

      context.onDiagnosticMessage?.({
        message: "Circular reference in function is currently not allowed",
        severity: DiagnosticSeverity.Error,
        span: this.span,
      });

      this.valueType = {
        kind: "Func",
        returnType: unknownType,
        parameters: this.parameters.map((x) => ({
          type: x.type.type ?? unknownType,
          name: x.name.text,
        })),
      } as FuncType;
      return;
    }

    this._analyzeState = "analyzing";
    for (const par of this.parameters) {
      par.analyze(context);
    }
    this.body.analyze(context);

    if (this._analyzeState !== "analyzing") {
      // Analyzed already done in a circular analyze
      return;
    }

    const allReturns = this.findReturns(this.body);
    const unionType: UnionType = {
      kind: "Union",
      types: allReturns
        .map((x) => x.expression?.valueType ?? nullType)
        .concat([this.body.valueType]),
    };

    const returnType = reduceUnionType(unionType);

    this._analyzeState = "analyzed";
    this.valueType = {
      kind: "Func",
      returnType,
      parameters: this.parameters.map((x) => ({
        type: x.type.type ?? unknownType,
        name: x.name.text,
      })),
    } as FuncType;
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
    public readonly parameters: ParameterNode[],
    // public readonly returnType: TypeSyntax | null,
    public readonly body: BlockNode
  ) {
    super([name, ...parameters, body]);
    this.symbol = new SourceSymbol(name.text, this);
  }
}

export class ParameterNode extends Node {
  public get valueType() {
    return this.type.type;
  }

  constructor(
    public readonly name: TokenNode,
    public readonly colon: TokenNode,
    public readonly type: TypeNode
  ) {
    super([name, colon, type]);
  }
}
