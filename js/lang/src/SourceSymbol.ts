import { ResolveContext } from "./common";
import { Symbol } from "./Symbol";
import { Type } from "./typeSystem";

export class SourceSymbol extends Symbol {
  public get isConst(): boolean {
    return this.node.isConst;
  }

  constructor(
    name: string,
    public readonly node: {
      resolve(context: ResolveContext): void;
      valueType: Type;
      isConst: boolean;
    }
  ) {
    super(name);
  }

  public get valueType(): Type {
    return this.node.valueType;
  }

  public resolve(context: ResolveContext): void {
    this.node.resolve(context);
  }
}
