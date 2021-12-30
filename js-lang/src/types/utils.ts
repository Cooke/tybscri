import { LiteralType } from "./common";
import { numberType } from "./number";
import { stringType } from "./string";

export function createLiteralType(value: string | number): LiteralType {
  return {
    kind: "Literal",
    value,
    valueType: typeof value === "string" ? stringType : numberType,
  };
}
