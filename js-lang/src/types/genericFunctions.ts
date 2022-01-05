import { FuncType } from ".";
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

export function bindTypeFromAssignments(
  type: Type,
  assignments: TypeParameterAssignment[]
): Type {
  switch (type.kind) {
    case "Object":
      return bindObjectFromAssignments(type, assignments);

    case "Func":
      return bindFuncFromAssignments(type, assignments);

    case "TypeParameter":
      return assignments.find((x) => x.parameter === type)?.assignment ?? type;
  }

  throw new Error("Not supported to bind " + type.kind);
}

function bindFuncFromAssignments(
  type: FuncType,
  assignments: TypeParameterAssignment[]
): FuncType {
  return {
    ...type,
    parameters: type.parameters.map((param) => ({
      ...param,
      type: bindTypeFromAssignments(param.type, assignments),
    })),
    returnType: bindTypeFromAssignments(type.returnType, assignments),
  };
}

function bindObjectFromAssignments(
  type: ObjectType,
  assignments: TypeParameterAssignment[]
) {
  if (!isBoundGenericType(type)) {
    return type;
  }

  const typeArguments = type.typeArguments.map((param) => {
    return (
      assignments.find((ass) => ass.parameter === param)?.assignment ?? param
    );
  });

  return {
    ...type,
    typeArguments,
  };
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

  return {
    ...type,
    typeArguments,
  };
}

export function isBoundGenericType(
  type: ObjectType
): type is BoundGenericObjectType {
  return (
    isGenericType(type) && !!type.typeArguments && type.typeArguments.length > 0
  );
}

export function isGenericType(type: ObjectType): type is GenericObjectType {
  return !!type.typeParameters && type.typeParameters.length > 0;
}
