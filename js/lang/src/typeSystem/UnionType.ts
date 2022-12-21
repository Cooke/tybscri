import { NeverType } from "./NeverType";
import { Type, Member, TypeParameterBinding } from "./common";

export class UnionType implements Type {
  public static create(types: Type[]) {
    if (types.length === 0) {
      return NeverType.instance;
    }

    function getFlattenTypes(type: Type): Type[] {
      if (type instanceof UnionType) {
        return type.types.reduce<Type[]>(
          (p, c) => [...p, ...getFlattenTypes(c)],
          []
        );
      }

      return [type];
    }

    const testTypes = types
      .reduce<Type[]>((p, c) => [...p, ...getFlattenTypes(c)], [])
      .filter((x) => x !== NeverType.instance);

    const resultTypes: Type[] = [];
    for (const type of testTypes) {
      if (!resultTypes.some((t) => t.isAssignableFrom(type))) {
        for (let i = resultTypes.length - 1; i >= 0; i--) {
          if (type.isAssignableFrom(resultTypes[i])) {
            resultTypes.splice(i, 1);
          }
        }

        resultTypes.push(type);
      }
    }

    if (resultTypes.length === 1) {
      return resultTypes[0];
    }

    return new UnionType(resultTypes);
  }

  private constructor(readonly types: Type[]) {}

  public get members(): Array<Member> {
    if (this.types.length === 0) {
      return [];
    }

    const members = this.types[0].members.reduce<{
      [key: string]: Member;
    }>((o, member) => {
      o[member.name] = member;
      return o;
    }, {});

    for (let i = 1; i < this.types.length; i++) {
      for (const member of this.types[i].members) {
        if (
          members[member.name] &&
          (!members[member.name].type.isAssignableFrom(member.type) ||
            !members[member.name].flags.every((f) =>
              member.flags.includes(f)
            ) ||
            !member.flags.every((f) => members[member.name].flags.includes(f)))
        ) {
          delete members[member.name];
        }
      }
    }

    return Object.values(members);
  }

  public get displayName(): string {
    return this.types.map((x) => x.displayName).join(" | ");
  }

  public isAssignableFrom(from: Type): boolean {
    return from instanceof UnionType
      ? from.types.every((ft) => this.types.some((t) => t.isAssignableFrom(ft)))
      : this.types.some((t) => t.isAssignableFrom(from));
  }

  public bind(bindings: TypeParameterBinding[]): Type {
    return UnionType.create(this.types.map((x) => x.bind(bindings)));
  }
}
