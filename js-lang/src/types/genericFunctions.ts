import {
  TypeParameter,
  ObjectType,
  Type,
  GenericObjectType,
  BoundGenericObjectType,
} from "./TypescriptTypes";

export interface TypeParameterAssignment {
  parameter: TypeParameter;
  assignment: Type;
}

export function substituteTypeParameters(
  type: Type,
  substitutions: TypeParameterAssignment[],
  boundTypes: [Type, Type][],
  
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

    case "TypeParameter":
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

export function bindObjectTypeParameters(
  type: ObjectType,
  typeArguments: Type[]
): ObjectType {
  if (!isGenericType(type) || isBoundGenericType(type)) {
    throw new Error("Only unbound generic types can be bound");
  }

  if (type.typeParameters.length !== typeArguments.length) {
    throw new Error("Type argument mismatch when binding type");
  }

  const typeAssignments = type.typeParameters.map<TypeParameterAssignment>(
    (parameter, index) => ({
      parameter: parameter,
      assignment: typeArguments[index],
    })
  );

  return {
    ...(substituteTypeParameters(type, typeAssignments, []) as ObjectType),
    typeArguments,
  };
}

export function isBoundGenericType(type: ObjectType): type is BoundGenericObjectType {
  return (
    isGenericType(type) && !!type.typeArguments && type.typeArguments.length > 0
  );
}

export function isGenericType(type: ObjectType): type is GenericObjectType {
  return !!type.typeParameters && type.typeParameters.length > 0;
}

function assign<T>(type: T, value: T) {
  Object.assign(type, value);
}
