import { FuncParameter, FuncType, Member, MemberFlag } from ".";
import { AnyDefinitionType, AnyType } from "./AnyType";
import { LiteralType } from "./LiteralType";
import { NeverDefinitionType, NeverType } from "./NeverType";
import { ObjectDefinitionType } from "./ObjectType";
import { UnknownType } from "./UnknownType";
import { VoidDefinitionType, VoidType } from "./VoidType";

export const objectDefinitionType: ObjectDefinitionType = new ObjectDefinitionType(
  "Object",
  null,
  [],
  () => [new Member([MemberFlag.Const], "toString", new FuncType([], stringType))]
);
export const objectType = objectDefinitionType.createType([]);

export const numberDefinitionType = new ObjectDefinitionType("Number", objectType, [], () => [
  new Member(
    [MemberFlag.Const, MemberFlag.Operator],
    "equals",
    new FuncType([new FuncParameter("arg", anyType)], booleanType)
  ),
]);
export const numberType = numberDefinitionType.createType([]);

export const stringDefinitionType = new ObjectDefinitionType("String", objectType, [], () => [
  new Member([MemberFlag.Const], "length", numberType),
]);
export const stringType = stringDefinitionType.createType([]);

export const unknownType = UnknownType.instance;

export const neverType = NeverType.instance;

export const anyType = AnyType.instance;

export const nullDefinitionType = new ObjectDefinitionType("Null", null, [], () => []);
export const nullType = nullDefinitionType.createType([]);

export const booleanDefinitionType = new ObjectDefinitionType("Boolean", objectType, [], () => []);
export const booleanType = booleanDefinitionType.createType([]);

export const trueType = new LiteralType(true, booleanType);
export const falseType = new LiteralType(false, booleanType);

export const voidDefinitionType = new VoidDefinitionType("Void");
export const voidType = VoidType.instance;

export const neverDefinitionType = new NeverDefinitionType("Never");

export const anyDefinitionType = new AnyDefinitionType("Any");
