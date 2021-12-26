import { LiteralType, ObjectType } from "./common";

export const booleanType: ObjectType = {
  kind: "Object",
  base: null,
  members: [],
  name: "boolean",
};

export const trueType: LiteralType = {
  kind: "Literal",
  value: true,
  valueType: booleanType,
};

export const falseType: LiteralType = {
  kind: "Literal",
  value: true,
  valueType: booleanType,
};
