import { TypeParameter } from ".";
import { Type, TypeParameterBinding } from "./common";
import { GenericObjectType, ObjectType } from "./ObjectType";
import { FuncParameter, FuncType } from "./FuncType";
import { LiteralType } from "./LiteralType";
import {
  booleanType,
  numberType,
  stringType,
  trueType,
  unknownType,
} from "./types";

export function widenType(type: Type) {
  if (type instanceof LiteralType) {
    return type.valueType;
  }

  return type;
}

export function narrowTypeTruthy(type: Type) {
  if (type === booleanType) {
    return trueType;
  }

  return type;
}

export function createLiteralType(
  value: string | number | boolean
): LiteralType {
  return new LiteralType(
    value,
    typeof value === "string"
      ? stringType
      : typeof value === "boolean"
      ? booleanType
      : numberType
  );
}

export function inferTypeArguments(
  parameters: readonly FuncParameter[],
  argTypes: readonly Type[]
): TypeParameterBinding[] {
  const results: TypeParameterBinding[] = [];
  for (let i = 0; i < parameters.length; i++) {
    const param = parameters[i];
    results.push(...inferTypes(param.type, argTypes[i] ?? unknownType));
  }
  return results;
}

export function inferTypes(to: Type, from: Type): TypeParameterBinding[] {
  if (to instanceof TypeParameter) {
    return [{ to: from, parameter: to }];
  } else if (to instanceof ObjectType) {
    const fromObject = from instanceof ObjectType ? from : null;

    if (!(to instanceof GenericObjectType)) {
      return [];
    }

    const results: TypeParameterBinding[] = [];
    for (let i = 0; i < to.typeArguments.length; i++) {
      results.push(
        ...inferTypes(
          to.typeArguments[i],
          (fromObject instanceof GenericObjectType
            ? fromObject.typeArguments?.[i]
            : unknownType) ?? unknownType
        )
      );
    }

    return results;
  } else if (to instanceof FuncType) {
    const fromFunc = from instanceof FuncType ? from : null;

    const results: TypeParameterBinding[] = [
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

  return [];
}
