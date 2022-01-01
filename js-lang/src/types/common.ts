import { booleanType, trueType } from "./boolean";
import { neverType } from "./never";

export type Type =
  | UnionType
  | LiteralType
  | FuncType
  | ObjectType
  | UnknownType
  | NeverType;

export interface UnknownType {
  readonly kind: "Unknown";
}

export interface NeverType {
  readonly kind: "Never";
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

export function areTypesEqual(from: Type, to: Type) {
  return isTypeAssignableToType(from, to) && isTypeAssignableToType(to, from);
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

        case "Never":
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

    case "Never":
    case "Unknown":
      return false;
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

export function narrowTypeTruthy(type: Type) {
  if (type === booleanType) {
    return trueType;
  }

  return type;
}

export function reduceUnionType(union: UnionType) {
  if (union.types.length === 0) {
    return neverType;
  }

  const testTypes = union.types.filter((x) => x.kind !== "Never");
  const resultTypes: Type[] = [];
  for (const type of testTypes) {
    if (!resultTypes.some((t) => isTypeAssignableToType(type, t))) {
      const replaceIndex = resultTypes.findIndex((t) =>
        isTypeAssignableToType(t, type)
      );
      if (replaceIndex !== -1) {
        resultTypes[replaceIndex] = type;
      } else {
        resultTypes.push(type);
      }
    }
  }

  if (resultTypes.length === 1) {
    return resultTypes[0];
  }

  const result: UnionType = {
    kind: "Union",
    types: resultTypes,
  };
  return result;
}
