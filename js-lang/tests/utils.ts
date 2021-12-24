import assert from "assert";
import { NodeValueType, TypeNotFound, UnknownType } from "../src/nodes/base";
import { Type } from "../src/types/common";

export function assertType(
  t: NodeValueType,
  expectedType: Type
): asserts t is Type {
  assert.equal(t, expectedType);
}

export function assertHasType(t: NodeValueType): asserts t is Type {
  assert.ok(t);
  assert.ok(!(t instanceof TypeNotFound));
  assert.ok(!(t instanceof UnknownType));
}

export function assertTypeNotFound(
  t: NodeValueType
): asserts t is TypeNotFound {
  assert.ok(t instanceof TypeNotFound);
}

export function assertUnknownType(t: NodeValueType): asserts t is UnknownType {
  assert.ok(t instanceof UnknownType);
}
