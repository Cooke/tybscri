import assert from "assert";
import {
  getTypeDisplayName,
  isTypeAssignableToType,
} from "../src/types/functions";
import { Type } from "../src/types/TypescriptTypes";

export function assertEqual<T>(val: any, expected: T): asserts val is T {
  assert.equal(val, expected);
}

export function assertType<T>(
  val: any,
  t: { new (...args: any[]): T }
): asserts val is T {
  assert.ok(
    val instanceof t,
    `Expected type '${t.name}' but was '${val?.constructor?.name ?? "unknown"}'`
  );
}

export function assertTybscriType<T extends Type>(
  actual: Type | null,
  expected: T
): asserts actual is T {
  assert.ok(actual, `Actual type is null`);
  assert.ok(
    isTypeAssignableToType(actual, expected) &&
      isTypeAssignableToType(expected, actual) &&
      actual.kind === expected.kind,
    `Actual type '${getTypeDisplayName(
      actual
    )}' but expected type '${getTypeDisplayName(expected)}'`
  );
}
