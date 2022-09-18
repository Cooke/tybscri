import { UnionType } from ".";
import { Type } from "./common";
import { LiteralType } from "./LiteralType";
import { booleanType, numberType, stringType, trueType } from "./types";

export function createUnionType(...types: Type[]) {
  return UnionType.create(types);
}

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

export function areTypesEqual(left: Type, right: Type) {
  return left.isAssignableFrom(right) && right.isAssignableFrom(left);
}
