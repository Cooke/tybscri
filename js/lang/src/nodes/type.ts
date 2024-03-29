import { CompileContext } from "../common";
import { Scope } from "../scope";
import { Symbol } from "../Symbol";
import { unknownType } from "../typeSystem";
import { Type } from "../typeSystem/common";
import { Node } from "./base";
import { IdentifierNode } from "./identifier";
import { LiteralNode } from "./literal";

export class TypeNode extends Node {
  private _type: Type = unknownType;

  public get type() {
    return this._type;
  }

  private typeSymbol: Symbol | null = null;

  public setupScopes(scope: Scope, context: CompileContext) {
    this.scope = scope;
  }

  public resolveTypes(context: CompileContext) {
    this.node.resolveTypes(context);

    if (this.node instanceof IdentifierNode) {
      this.typeSymbol = this.scope.resolveLast(this.node.token.text);
      this._type = this.typeSymbol?.valueType ?? unknownType;
      // TODO report if not found
    } else {
      this._type = this.node.valueType;
    }
  }

  constructor(public readonly node: LiteralNode | IdentifierNode) {
    super([node]);
  }
}
