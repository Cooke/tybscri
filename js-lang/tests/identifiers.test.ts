import assert from "assert";
import { error } from "console";
import { parseExpression } from "../src";
import {
  DiagnosticMessage,
  DiagnosticSeverity,
  ExternalSymbol,
  Scope,
} from "../src/common";
import { stringType } from "../src/types/string";
import { assertTybscriType } from "./utils";

describe("Identifiers", function () {
  it("undetermined identifier type", function () {
    const msgs: DiagnosticMessage[] = [];
    const parseResult = parseExpression("data", {
      onDiagnosticMessage: (msg) => msgs.push(msg),
    });
    assert.equal(parseResult.tree.valueType, null);
    assert.equal(msgs.length, 1);
    assert.equal(msgs[0].severity, DiagnosticSeverity.Error);
  });

  it("identifier type", function () {
    const scope = new Scope(null, [new ExternalSymbol("data", stringType)]);
    const parseResult = parseExpression("data", { scope });
    assertTybscriType(parseResult.tree.valueType, stringType);
  });
});
