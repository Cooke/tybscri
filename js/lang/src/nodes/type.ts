import { CompileContext, ResolveContext } from "../common";
import { Scope } from "../scope";
import { Symbol } from "../Symbol";
import { unknownType } from "../typeSystem";
import { isDefinitionType, Type } from "../typeSystem/common";
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
    this.node.setupScopes(scope, context);
    this.scope = scope;
  }

  public resolve(context: ResolveContext) {
    this.node.resolve(context.withExpectedType(null));

    if (this.node instanceof IdentifierNode) {
      this.typeSymbol = this.scope.resolveLast(this.node.token.text);
      let resolvedType = this.typeSymbol?.valueType ?? unknownType;
      // If the type is a definition type (e.g., ObjectDefinitionType), convert to instance type
      if (isDefinitionType(resolvedType)) {
        resolvedType = resolvedType.createType([]);
      }
      this._type = resolvedType;
      // TODO report if not found
    } else {
      this._type = this.node.valueType;
    }
  }

  constructor(public readonly node: LiteralNode | IdentifierNode) {
    super([node]);
  }
}
