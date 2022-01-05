import {
  GenericObjectType,
  ObjectType,
  Type,
  TypeParameter,
  FuncType,
} from "./TypescriptTypes";

export interface TypeParameterBinding {
  parameter: TypeParameter;
  to: Type;
}

export function bindType(type: Type, bindings: TypeParameterBinding[]): Type {
  switch (type.kind) {
    case "Object":
      return bindObjectType(type, bindings);

    case "Func":
      return bindFuncType(type, bindings);

    case "TypeParameter":
      return bindings.find((x) => x.parameter === type)?.to ?? type;
  }

  return type;
}

function bindFuncType(
  type: FuncType,
  bindings: TypeParameterBinding[]
): FuncType {
  return {
    ...type,
    parameters: type.parameters.map((param) => ({
      ...param,
      type: bindType(param.type, bindings),
    })),
    returnType: bindType(type.returnType, bindings),
  };
}

function bindObjectType(type: ObjectType, bindings: TypeParameterBinding[]) {
  if (!isGenericType(type)) {
    return type;
  }

  const typeArguments = type.typeArguments.map((param) => {
    return bindings.find((ass) => ass.parameter === param)?.to ?? param;
  });

  return {
    ...type,
    typeArguments,
  };
}

export function deriveObjectType(
  type: GenericObjectType,
  typeArguments: Type[]
): GenericObjectType {
  if (type.typeParameters.length !== typeArguments.length) {
    throw new Error("Type argument mismatch when binding type");
  }

  return {
    ...type,
    typeArguments,
  };
}

export function isGenericType(type: ObjectType): type is GenericObjectType {
  return !!type.typeParameters && type.typeParameters.length > 0;
}
