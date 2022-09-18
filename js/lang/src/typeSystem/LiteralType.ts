import { Type, Member, TypeParameterBinding } from "./common";

export class LiteralType implements Type {
  constructor(readonly value: any, readonly valueType: Type) {}

  public get members(): Array<Member> {
    return this.valueType.members;
  }

  public get displayName(): string {
    return typeof this.value === "string"
      ? '"' + this.value.toString() + '"'
      : this.value.toString();
  }

  public isAssignableFrom(type: Type): boolean {
    return (
      type instanceof LiteralType &&
      type.valueType === this.valueType &&
      this.value === type.value
    );
  }

  public bind(bindings: TypeParameterBinding[]): Type {
    return this;
  }
}
