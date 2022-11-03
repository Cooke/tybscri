import assert from "assert";
import { Type, UnionType } from "../src/typeSystem";
import { parseEnvironment } from "../src/typeSystem/serialization";

describe("Environment", function () {
  it("parse", function () {
    const env = parseEnvironment(`{
        "collectionDefinition": "List",
        "symbols": [
          {
            "name": "List",
            "type": {
              "name": "List",
              "base": null,
              "members": [
                {
                  "name": "filter",
                  "settable": false,
                  "type": {
                    "parameters": [
                      {
                        "name": "item",
                        "type": {
                          "name": "T",
                          "kind": "TypeReference"
                        }
                      }
                    ],
                    "returnType": {
                      "definitionName": "Boolean",
                      "typeArguments": [],
                      "kind": "Object"
                    },
                    "kind": "Func"
                  },
                  "typeParameters": []
                }
              ],
              "typeParameters": [
                {
                  "name": "T",
                  "variance": "None"
                }
              ],
              "kind": "ObjectDefinition"
            }
          },
          {
            "name": "Number",
            "type": {
              "name": "Number",
              "base": null,
              "members": [],
              "typeParameters": [],
              "kind": "ObjectDefinition"
            }
          },
          {
            "name": "Boolean",
            "type": {
              "name": "Boolean",
              "base": null,
              "members": [],
              "typeParameters": [],
              "kind": "ObjectDefinition"
            }
          },
          {
            "name": "Null",
            "type": {
              "name": "Null",
              "base": null,
              "members": [],
              "typeParameters": [],
              "kind": "ObjectDefinition"
            }
          },
          {
            "name": "String",
            "type": {
              "name": "String",
              "base": null,
              "members": [
                {
                  "name": "length",
                  "settable": false,
                  "type": {
                    "definitionName": "Number",
                    "typeArguments": [],
                    "kind": "Object"
                  },
                  "typeParameters": []
                }
              ],
              "typeParameters": [],
              "kind": "ObjectDefinition"
            }
          },
          {
            "name": "Void",
            "type": {
              "name": "Void",
              "kind": "VoidDefinition"
            }
          },
          {
            "name": "Never",
            "type": {
              "name": "Never",
              "kind": "NeverDefinition"
            }
          },
          {
            "name": "input",
            "type": {
              "definitionName": "Number",
              "typeArguments": [],
              "kind": "Object"
            }
          }
        ]
      }`);
    assert.ok(env);
  });
});
