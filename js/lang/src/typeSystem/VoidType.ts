import { DefinitionType } from ".";
import { Type, Member, TypeParameterBinding, TypeParameter } from "./common";

export class VoidDefinitionType implements DefinitionType {
  readonly typeParameters = [];
  readonly displayName: string;
  readonly members = [];

  constructor(public readonly name: string) {
    this.displayName = name;
  }

  createType(typeArguments: Type[]): Type {
    return VoidType.instance;
  }

  isAssignableFrom(type: Type): boolean {
    return false;
  }

  bind(bindings: TypeParameterBinding[]): Type {
    return this;
  }
}

export class VoidType implements Type {
  public static readonly instance = new VoidType();

  public readonly members: Array<Member> = [];

  public readonly displayName = "void";

  private constructor() {}

  isAssignableFrom(type: Type): boolean {
    return false;
  }

  public bind(bindings: TypeParameterBinding[]): Type {
    return this;
  }
}
