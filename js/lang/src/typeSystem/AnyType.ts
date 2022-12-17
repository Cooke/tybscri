import { DefinitionType } from ".";
import { Type, Member, TypeParameterBinding, TypeParameter } from "./common";

export class AnyDefinitionType implements DefinitionType {
  readonly typeParameters = [];
  readonly displayName: string;
  readonly members = [];

  constructor(public readonly name: string) {
    this.displayName = name;
  }

  createType(typeArguments: Type[]): Type {
    return AnyType.instance;
  }

  isAssignableFrom(type: Type): boolean {
    return false;
  }

  bind(bindings: TypeParameterBinding[]): Type {
    return this;
  }
}

export class AnyType implements Type {
  public static readonly instance = new AnyType();

  public readonly members: Array<Member> = [];

  public readonly displayName = "any";

  private constructor() {}

  isAssignableFrom(type: Type): boolean {
    return true;
  }

  public bind(bindings: TypeParameterBinding[]): Type {
    return this;
  }
}
