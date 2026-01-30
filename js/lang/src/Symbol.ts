import { CompileContext, ResolveContext, createResolveContext } from "./common";
import { Type } from "./typeSystem";

export abstract class Symbol {
  constructor(public readonly name: string) {}

  public abstract get isConst(): boolean;

  public abstract get valueType(): Type;

  public abstract resolve(context: ResolveContext): void;

  /** @deprecated Use resolve(context) instead */
  public resolveTypes(context: CompileContext): void {
    this.resolve(createResolveContext(context));
  }
}
