import assert from "assert";
import { parseExpression } from "../src";
import { DiagnosticSeverity, Environment } from "../src/common";
import { defaultEnvironment } from "../src/defaultEnvironment";
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
      ...defaultEnvironment,
      symbols: [{ name: "data", type: stringType }],
    };
    const parseResult = parseExpression("data", { environment: env });
    assertTybscriType(parseResult.tree.valueType, stringType);
  });
});
