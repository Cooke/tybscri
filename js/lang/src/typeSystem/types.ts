import { FuncType, Member } from ".";
import { TypeParameter } from "./common";
import { ObjectType } from "./ObjectType";
import { LiteralType } from "./LiteralType";
import { NeverType } from "./NeverType";
import { UnknownType } from "./UnknownType";

export const objectType: ObjectType = new ObjectType("object", null, () => [
  new Member(true, "toString", new FuncType([], stringType)),
]);

export const numberType: ObjectType = new ObjectType(
  "number",
  objectType,
  () => []
);

export const stringType: ObjectType = new ObjectType(
  "string",
  objectType,
  () => [new Member(true, "length", numberType)]
);

export const unknownType = UnknownType.instance;

export const neverType = NeverType.instance;

export const nullType: ObjectType = new ObjectType("null", null, () => []);

export const booleanType = new ObjectType("boolean", objectType, () => []);
export const trueType = new LiteralType(true, booleanType);
export const falseType = new LiteralType(false, booleanType);
