import { Member, Type, TypeParameterBinding } from "./common";

export class FuncParameter {
  constructor(readonly name: string, readonly type: Type) {}
}

export class FuncType implements Type {
  constructor(
    readonly parameters: readonly FuncParameter[],
    readonly returnType: Type
  ) {}

  public readonly members: Array<Member> = [];

  public get displayName(): string {
    return `(${this.parameters.map(
      (p) => `${p.name}: ${p.type.displayName}`
    )}) => ${this.returnType.displayName}`;
  }

  public isAssignableFrom(from: Type): boolean {
    return (
      from instanceof FuncType &&
      this.returnType.isAssignableFrom(from.returnType) &&
      this.parameters.length >= from.parameters.length &&
      from.parameters.every((fp, i) =>
        fp.type.isAssignableFrom(this.parameters[i].type)
      )
    );
  }

  public bind(bindings: TypeParameterBinding[]): Type {
    return new FuncType(
      this.parameters.map(
        (param) => new FuncParameter(param.name, param.type.bind(bindings))
      ),
      this.returnType.bind(bindings)
    );
  }
}
