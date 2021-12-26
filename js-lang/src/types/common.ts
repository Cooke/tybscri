export type Type = UnionType | LiteralType | FuncType | RegularType;

export interface UnionType {
  readonly kind: "Union";
  readonly types: Type[];
}

export interface LiteralType {
  readonly kind: "Literal";
  readonly value: any;
  readonly valueType: Type;
}

export interface RegularType {
  readonly kind: "Regular";
  readonly base: RegularType | null;
  readonly members: Array<MemberDef>;
  readonly name: string;
}

export interface TypeParameterDef {
  readonly name: string;
}

export interface MemberDef {
  readonly isConst: boolean;
  readonly name: string;
  readonly type: Type;
}

export interface FuncType {
  readonly kind: "Func";
  readonly parameters: readonly ParameterDef[];
  readonly returnType: Type;
}

export interface ParameterDef {
  readonly name: string;
  readonly type: Type;
}

export interface TypeTable {
  [name: string]: Type;
}

export function getTypeDisplayName(type: Type): string {
  switch (type.kind) {
    case "Regular":
      return type.name;

    case "Literal":
      return type.valueType.kind === "Regular" &&
        type.valueType.name === "number"
        ? type.value.toString()
        : '"' + type.value.toString() + '"';

    case "Func":
      return `(${type.parameters.map((p) =>
        getTypeDisplayName(p.type)
      )}) => ${getTypeDisplayName(type.returnType)}`;

    default:
      return type.kind;
  }
}

export function getAllTypeMembers(type: Type): MemberDef[] {
  switch (type.kind) {
    case "Regular":
      return type.members.concat(type.base ? getAllTypeMembers(type.base) : []);

    case "Union":
      if (type.types.length === 0) {
        return [];
      }

      const members = getAllTypeMembers(type.types[0]).reduce<{
        [key: string]: MemberDef;
      }>((o, member) => {
        o[member.name] = member;
        return o;
      }, {});

      for (let i = 1; i < type.types.length; i++) {
        for (const member of getAllTypeMembers(type.types[i])) {
          if (
            members[member.name] &&
            (!isTypeAssignableToType(member.type, members[member.name].type) ||
              members[member.name].isConst !== member.isConst)
          ) {
            delete members[member.name];
          }
        }
      }
  }

  return [];
}

export function isTypeAssignableToType(from: Type, to: Type): boolean {
  switch (to.kind) {
    case "Regular":
      switch (from.kind) {
        case "Regular": {
          let testType: RegularType | null | undefined = from;
          while (testType != null) {
            if (testType.name === to.name) {
              return true;
            }
            testType = testType.base;
          }

          return false;
        }

        case "Union":
          return from.types.every((t) => isTypeAssignableToType(t, to));

        case "Func":
          return false;

        case "Literal":
          return isTypeAssignableToType(from.valueType, to);
      }

    case "Func": {
      return (
        from.kind === "Func" &&
        isTypeAssignableToType(from.returnType, to.returnType) &&
        to.parameters.length >= from.parameters.length &&
        from.parameters.every((fp, i) =>
          isTypeAssignableToType(to.parameters[i].type, fp.type)
        )
      );
    }

    case "Union": {
      return to.types.some((t) => isTypeAssignableToType(from, t));
    }

    case "Literal": {
      return from.kind === "Literal" && from.value === to.value;
    }
  }
}
