import { DefinitionType } from ".";
import { Type, Member, TypeParameterBinding, TypeParameter } from "./common";

export class NeverDefinitionType implements DefinitionType {
  readonly typeParameters = [];
  readonly displayName: string;
  readonly members = [];

  constructor(public readonly name: string) {
    this.displayName = name;
  }

  createType(typeArguments: Type[]): Type {
    return NeverType.instance;
  }

  isAssignableFrom(type: Type): boolean {
    return false;
  }

  bind(bindings: TypeParameterBinding[]): Type {
    return this;
  }
}

export class NeverType implements Type {
  public static readonly instance = new NeverType();

  public readonly members: Array<Member> = [];

  public readonly displayName = "never";

  private constructor() {}

  isAssignableFrom(type: Type): boolean {
    return false;
  }

  public bind(bindings: TypeParameterBinding[]): Type {
    return this;
  }
}
