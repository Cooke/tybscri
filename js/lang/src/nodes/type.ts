import { Scope } from "../scope";
import { Symbol } from "../symbols";
import { unknownType } from "../typeSystem";
import { numberType, stringType } from "../typeSystem/types";
import { Type } from "../typeSystem/common";
import { LiteralType } from "../typeSystem/LiteralType";
import { Node } from "./base";
import { CompileContext } from "../common";
import { IdentifierNode } from "./identifier";
import { LiteralNode } from "./literal";

export class TypeNode extends Node {
  private _type: Type = unknownType;

  public get type() {
    return this._type;
  }

  private typeSymbol: Symbol | null = null;

  public setupScopes(scope: Scope, context: CompileContext) {
    if (this.node instanceof IdentifierNode) {
      this.typeSymbol = scope.resolveLast(this.node.token.text);
      // TODO report if not found
    } else {
      this._type = new LiteralType(
        this.node.value,
        typeof this.node.value === "string" ? stringType : numberType
      );
    }

    this.scope = scope;
  }

  public resolveTypes(context: CompileContext) {
    if (this.typeSymbol) {
      this.typeSymbol.resolveTypes(context);
      this._type = this.typeSymbol.valueType;
    }
  }

  constructor(public readonly node: LiteralNode | IdentifierNode) {
    super([node]);
  }
}
