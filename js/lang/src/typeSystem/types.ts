import { FuncParameter, FuncType, Member, MemberFlag } from ".";
import { AnyType } from "./AnyType";
import { LiteralType } from "./LiteralType";
import { NeverType } from "./NeverType";
import { ObjectDefinitionType } from "./ObjectType";
import { UnknownType } from "./UnknownType";

export const objectDefinitionType: ObjectDefinitionType =
  new ObjectDefinitionType("object", null, [], () => [
    new Member([MemberFlag.Const], "toString", new FuncType([], stringType)),
  ]);
export const objectType = objectDefinitionType.createType([]);

export const numberDefinitionType = new ObjectDefinitionType(
  "number",
  objectType,
  [],
  () => [
    new Member(
      [MemberFlag.Const, MemberFlag.Operator],
      "equals",
      new FuncType([new FuncParameter("arg", anyType)], booleanType)
    ),
  ]
);
export const numberType = numberDefinitionType.createType([]);

export const stringDefinitionType = new ObjectDefinitionType(
  "string",
  objectType,
  [],
  () => [new Member([MemberFlag.Const], "length", numberType)]
);
export const stringType = stringDefinitionType.createType([]);

export const unknownType = UnknownType.instance;

export const neverType = NeverType.instance;

export const anyType = AnyType.instance;

export const nullDefinitionType = new ObjectDefinitionType(
  "null",
  null,
  [],
  () => []
);
export const nullType = nullDefinitionType.createType([]);

export const booleanDefinitionType = new ObjectDefinitionType(
  "boolean",
  objectType,
  [],
  () => []
);
export const booleanType = booleanDefinitionType.createType([]);

export const trueType = new LiteralType(true, booleanType);
export const falseType = new LiteralType(false, booleanType);
