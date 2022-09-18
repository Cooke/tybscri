import { Type, Member, TypeParameterBinding } from "./common";

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
