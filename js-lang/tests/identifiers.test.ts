import assert from "assert";
import { parseExpression } from "../src";
import { DiagnosticMessage, DiagnosticSeverity } from "../src/common";
import { Scope } from "../src/scope";
import { ExternalSymbol } from "../src/symbols";
import { stringType, unknownType } from "../src/typeSystem";
import { assertTybscriType } from "./utils";

describe("Identifiers", function () {
  it("undetermined identifier type", function () {
    const msgs: DiagnosticMessage[] = [];
    const parseResult = parseExpression("data", {
      onDiagnosticMessage: (msg) => msgs.push(msg),
    });
    assert.equal(parseResult.tree.valueType, unknownType);
    assert.equal(msgs.length, 1);
    assert.equal(msgs[0].severity, DiagnosticSeverity.Error);
  });

  it("identifier type", function () {
    const scope = new Scope(null, [new ExternalSymbol("data", stringType)]);
    const parseResult = parseExpression("data", { scope });
    assertTybscriType(parseResult.tree.valueType, stringType);
  });
});
