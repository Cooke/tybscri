import { GenericTypeParameter, ObjectType, Type } from "./TypescriptTypes";

export interface TypeParameterAssignment {
  parameter: GenericTypeParameter;
  assignment: Type;
}

export function substituteTypeParameters(
  type: Type,
  substitutions: TypeParameterAssignment[],
  boundTypes: [Type, Type][]
): Type {
  const boundType = boundTypes.find((x) => x[0] === type)?.[1];
  if (boundType) {
    return boundType;
  }

  switch (type.kind) {
    case "Object":
      const boundObjectType = {} as ObjectType;
      boundTypes.push([type, boundObjectType]);
      assign(boundObjectType, {
        ...type,
        kind: "Object",
        base: type.base
          ? (substituteTypeParameters(
              type.base,
              substitutions,
              boundTypes
            ) as ObjectType)
          : null,
        members: type.members.map((member) => ({
          ...member,
          type: substituteTypeParameters(
            member.type,
            substitutions,
            boundTypes
          ),
        })),
        typeArguments: type.typeArguments?.map((t) =>
          substituteTypeParameters(t, substitutions, boundTypes)
        ),
      });
      return boundObjectType;

    case "GenericParameter":
      return (
        substitutions.find((x) => x.parameter === type)?.assignment ?? type
      );

    case "Func": {
      const parameters = type.parameters.map((param) => ({
        ...param,
        type: substituteTypeParameters(param.type, substitutions, boundTypes),
      }));
      return {
        ...type,
        kind: "Func",
        parameters,
        returnType: substituteTypeParameters(
          type.returnType,
          substitutions,
          boundTypes
        ),
      };
    }
  }

  return type;
}

export function createGenericType(
  openType: ObjectType,
  args: Type[]
): ObjectType {
  if (openType.typeArguments?.length !== args.length) {
    throw new Error(
      "Type argument mismatch when creating a closed generic type"
    );
  }

  if (openType.typeArguments.some((x) => x.kind !== "GenericParameter")) {
    throw new Error("Cannot create generic type from closed generic type");
  }

  const typeAssignments = openType.typeArguments.map<TypeParameterAssignment>(
    (arg, index) => ({
      parameter: arg as GenericTypeParameter,
      assignment: args[index],
    })
  );

  return substituteTypeParameters(openType, typeAssignments, []) as ObjectType;
}

function assign<T>(type: T, value: T) {
  Object.assign(type, value);
}
