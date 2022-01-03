import { Scope, Symbol } from "../common";
import { unknownType } from "../types";
import { numberType, stringType } from "../types/types";
import { Type } from "../types/TypescriptTypes";
import { AnalyzeContext, Node } from "./base";
import { IdentifierNode } from "./identifier";
import { LiteralNode } from "./literal";

export class TypeNode extends Node {
  private _type: Type = unknownType;

  public get type() {
    return this._type;
  }

  private typeSymbol: Symbol | null = null;

  public setupScopes(scope: Scope, context: AnalyzeContext) {
    if (this.node instanceof IdentifierNode) {
      this.typeSymbol = scope.resolveLast(this.node.token.text);
      // TODO report if not found
    } else {
      this._type = {
        kind: "Literal",
        value: this.node.value,
        valueType:
          typeof this.node.value === "string" ? stringType : numberType,
      };
    }

    this.scope = scope;
  }

  public analyze(context: AnalyzeContext) {
    if (this.typeSymbol) {
      this.typeSymbol.analyze(context);
      this._type = this.typeSymbol.valueType;
    }
  }

  constructor(public readonly node: LiteralNode | IdentifierNode) {
    super([node]);
  }
}
