import { SourceSpan, ResolveContext, createResolveContext } from "../common";
import { Scope } from "../scope";
import { Type } from "../typeSystem/common";
import { CompileContext } from "../common";

export abstract class Node {
  private _scope: Scope = Scope.empty;

  public get scope() {
    return this._scope;
  }

  protected set scope(val: Scope) {
    this._scope = val;
  }

  public get valueType(): Type | undefined {
    return undefined;
  }

  constructor(public readonly children: Node[]) {}

  public setupScopes(scope: Scope, context: CompileContext) {
    for (const child of this.children) {
      child.setupScopes(scope, context);
    }
    this._scope = scope;
  }

  public resolve(context: ResolveContext) {
    for (const child of this.children) {
      child.resolve(context.withExpectedType(null));
    }
  }

  /** @deprecated Use resolve(context) instead */
  public resolveTypes(context: CompileContext, expectedType?: Type | null) {
    this.resolve(createResolveContext(context, expectedType ?? null));
  }

  public get span(): SourceSpan {
    const children = this.children;
    if (children.length === 0) {
      throw new Error("Invalid start property implementation");
    }

    return {
      start: children[0].span.start,
      stop: children[children.length - 1].span.stop,
    };
  }

  public toString(): string {
    return `${this.constructor.name}[${this.span.start.index}..${this.span.stop.index}]`;
  }
}
