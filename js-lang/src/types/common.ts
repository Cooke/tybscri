export type Type =
  | UnionType
  | LiteralType
  | FuncType
  | ObjectType
  | UnknownType;

export interface UnknownType {
  readonly kind: "Unknown";
}

export interface UnionType {
  readonly kind: "Union";
  readonly types: Type[];
}

export interface LiteralType {
  readonly kind: "Literal";
  readonly value: any;
  readonly valueType: Type;
}

export interface ObjectType {
  readonly kind: "Object";
  readonly base: ObjectType | null;
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
    case "Object":
      return type.name;

    case "Literal":
      return type.valueType.kind === "Object" &&
        type.valueType.name === "string"
        ? '"' + type.value.toString() + '"'
        : type.value.toString();

    case "Func":
      return `(${type.parameters.map((p) =>
        getTypeDisplayName(p.type)
      )}) => ${getTypeDisplayName(type.returnType)}`;

    case "Union":
      return type.types.map(getTypeDisplayName).join(" | ");

    default:
      return type.kind;
  }
}

export function getAllTypeMembers(type: Type): MemberDef[] {
  switch (type.kind) {
    case "Object":
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
    case "Object":
      switch (from.kind) {
        case "Object": {
          let testType: ObjectType | null | undefined = from;
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

        case "Unknown":
          return false;
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
      return from.kind === "Union"
        ? from.types.every((ft) =>
            to.types.some((t) => isTypeAssignableToType(ft, t))
          )
        : to.types.some((t) => isTypeAssignableToType(from, t));
    }

    case "Literal": {
      return from.kind === "Literal" && from.value === to.value;
    }

    case "Unknown": {
      return false;
    }
  }
}

export function widenType(type: Type) {
  switch (type.kind) {
    case "Literal":
      return type.valueType;

    default:
      return type;
  }
}
