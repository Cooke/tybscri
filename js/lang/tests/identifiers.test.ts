import assert from "assert";
import { parseExpression } from "../src";
import {
  DiagnosticMessage,
  DiagnosticSeverity,
  Environment,
} from "../src/common";
import { Scope } from "../src/scope";
import { ExternalSymbol } from "../src/symbols";
import { stringType, unknownType } from "../src/typeSystem";
import { assertTybscriType } from "./utils";

describe("Identifiers", function () {
  it("undetermined identifier type", function () {
    const parseResult = parseExpression("data");
    assert.equal(parseResult.tree.valueType, unknownType);
    assert.equal(parseResult.diagnosticMessages.length, 1);
    assert.equal(
      parseResult.diagnosticMessages[0].severity,
      DiagnosticSeverity.Error
    );
  });

  it("identifier type", function () {
    const env: Environment = {
      symbols: [{ name: "data", type: stringType }],
    };
    const parseResult = parseExpression("data", { environment: env });
    assertTybscriType(parseResult.tree.valueType, stringType);
  });
});
