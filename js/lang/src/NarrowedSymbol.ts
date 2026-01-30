import { ResolveContext } from "./common";
import { Symbol } from "./Symbol";
import { Type, unknownType } from "./typeSystem";

export class NarrowedSymbol extends Symbol {
  public get isConst(): boolean {
    return this.outerSymbol.isConst;
  }

  constructor(
    public readonly outerSymbol: Symbol,
    private readonly narrower: (context: ResolveContext) => Type
  ) {
    super(outerSymbol.name);
  }

  public valueType: Type = unknownType;

  public resolve(context: ResolveContext): void {
    this.outerSymbol.resolve(context);
    this.valueType = this.narrower(context);
  }
}
