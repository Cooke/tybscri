import { TypeParameterAssignment } from "./genericFunctions";
import {
  booleanType,
  neverType,
  numberType,
  stringType,
  trueType,
  unknownType,
} from "./types";
import {
  FuncParameter,
  GenericTypeParameter,
  LiteralType,
  ObjectMember,
  ObjectType,
  Type,
  UnionType,
} from "./TypescriptTypes";
export * from "./genericFunctions";

export function getTypeDisplayName(type: Type): string {
  switch (type.kind) {
    case "GenericParameter":
      return `${type.name}`;

    case "Object":
      const suffix = type.typeArguments
        ? `<${type.typeArguments.map((x) => getTypeDisplayName(x)).join(", ")}>`
        : "";
      return `${type.name}${suffix}`;

    case "Literal":
      return type.valueType.kind === "Object" &&
        type.valueType.name === "string"
        ? '"' + type.value.toString() + '"'
        : type.value.toString();

    case "Func":
      return `(${type.parameters.map(
        (p) => `${p.name}: ${getTypeDisplayName(p.type)}`
      )}) => ${getTypeDisplayName(type.returnType)}`;

    case "Union":
      return type.types.map(getTypeDisplayName).join(" | ");

    default:
      return type.kind;
  }
}

export function getAllTypeMembers(type: Type): ObjectMember[] {
  switch (type.kind) {
    case "Object":
      return type.members.concat(type.base ? getAllTypeMembers(type.base) : []);

    case "Literal":
      return getAllTypeMembers(type.valueType);

    case "Union":
      if (type.types.length === 0) {
        return [];
      }

      const members = getAllTypeMembers(type.types[0]).reduce<{
        [key: string]: ObjectMember;
      }>((o, member) => {
        o[member.name] = member;
        return o;
      }, {});

      for (let i = 1; i < type.types.length; i++) {
        for (const member of getAllTypeMembers(type.types[i])) {
          if (
            members[member.name] &&
            member.type &&
            members[member.name].type &&
            (!isTypeAssignableToType(member.type, members[member.name].type!) ||
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

        case "GenericParameter":
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

    case "GenericParameter":
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

  const testTypes = getFlattenTypes(union).filter((x) => x.kind !== "Never");

  const resultTypes: Type[] = [];
  for (const type of testTypes) {
    if (!resultTypes.some((t) => isTypeAssignableToType(type, t))) {
      for (let i = resultTypes.length - 1; i >= 0; i--) {
        if (isTypeAssignableToType(resultTypes[i], type)) {
          resultTypes.splice(i, 1);
        }
      }

      resultTypes.push(type);
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

function getFlattenTypes(type: Type): Type[] {
  if (type.kind === "Union") {
    return type.types.reduce<Type[]>(
      (p, c) => [...p, ...getFlattenTypes(c)],
      []
    );
  }

  return [type];
}

export function createLiteralType(
  value: string | number | boolean
): LiteralType {
  return {
    kind: "Literal",
    value,
    valueType:
      typeof value === "string"
        ? stringType
        : typeof value === "boolean"
        ? booleanType
        : numberType,
  };
}

export function createUnionType(...types: Type[]): UnionType {
  return {
    kind: "Union",
    types,
  };
}

export function inferTypeArguments(
  parameters: readonly FuncParameter[],
  argTypes: Type[]
): TypeParameterAssignment[] {
  const results: TypeParameterAssignment[] = [];
  for (let i = 0; i < parameters.length; i++) {
    const param = parameters[i];
    results.push(...inferTypes(param.type, argTypes[i] ?? unknownType));
  }
  return results;
}

export function inferTypes(to: Type, from: Type): TypeParameterAssignment[] {
  switch (to.kind) {
    case "GenericParameter":
      return [{ assignment: from, parameter: to }];

    case "Object":
      const fromObject = from.kind === "Object" ? from : null;

      const results: TypeParameterAssignment[] = [];

      for (let i = 0; i < (to.typeArguments?.length ?? 0); i++) {
        results.push(
          ...inferTypes(
            to.typeArguments![i],
            fromObject?.typeArguments?.[i] ?? unknownType
          )
        );
      }

      return results;

    case "Func": {
      const fromFunc = from.kind === "Func" ? from : null;

      const results: TypeParameterAssignment[] = [
        ...inferTypes(to.returnType, fromFunc?.returnType ?? unknownType),
      ];

      for (let i = 0; i < to.parameters.length; i++) {
        results.push(
          ...inferTypes(
            to.parameters[i].type,
            fromFunc?.parameters[i]?.type ?? unknownType
          )
        );
      }

      return results;
    }
  }

  return [];
}
