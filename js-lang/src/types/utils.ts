import { LiteralType, Type, UnionType } from "./common";
import { numberType, stringType } from "./";

export function createLiteralType(value: string | number): LiteralType {
  return {
    kind: "Literal",
    value,
    valueType: typeof value === "string" ? stringType : numberType,
  };
}

export function createUnionType(...types: Type[]): UnionType {
  return {
    kind: "Union",
    types,
  };
}
