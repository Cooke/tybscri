import { Type, Member, TypeParameterBinding } from "./common";

export class UnknownType implements Type {
  public static readonly instance = new UnknownType();

  public readonly members: Array<Member> = [];

  public readonly displayName = "unknown";

  private constructor() {}

  public isAssignableFrom(type: Type): boolean {
    return false;
  }

  public bind(bindings: TypeParameterBinding[]): Type {
    return this;
  }
}
