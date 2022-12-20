export const demoEnvironmentJson = `{
    "symbols": [
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
                    "name": "predicate",
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
                    }
                  }
                ],
                "returnType": {
                  "definitionName": "List",
                  "typeArguments": [
                    {
                      "name": "T",
                      "kind": "TypeReference"
                    }
                  ],
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
        "name": "Any",
        "type": {
          "name": "Any",
          "kind": "AnyDefinition"
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
        "name": "Npc",
        "type": {
          "name": "Npc",
          "base": null,
          "members": [
            {
              "name": "attack",
              "settable": false,
              "type": {
                "parameters": [
                  {
                    "name": "player",
                    "type": {
                      "definitionName": "Player",
                      "typeArguments": [],
                      "kind": "Object"
                    }
                  }
                ],
                "returnType": {
                  "name": "Void",
                  "kind": "TypeReference"
                },
                "kind": "Func"
              },
              "typeParameters": []
            },
            {
              "name": "name",
              "settable": false,
              "type": {
                "definitionName": "String",
                "typeArguments": [],
                "kind": "Object"
              },
              "typeParameters": []
            },
            {
              "name": "say",
              "settable": false,
              "type": {
                "parameters": [
                  {
                    "name": "message",
                    "type": {
                      "definitionName": "String",
                      "typeArguments": [],
                      "kind": "Object"
                    }
                  }
                ],
                "returnType": {
                  "name": "Void",
                  "kind": "TypeReference"
                },
                "kind": "Func"
              },
              "typeParameters": []
            }
          ],
          "typeParameters": [],
          "kind": "ObjectDefinition"
        }
      },
      {
        "name": "Player",
        "type": {
          "name": "Player",
          "base": null,
          "members": [
            {
              "name": "name",
              "settable": false,
              "type": {
                "definitionName": "String",
                "typeArguments": [],
                "kind": "Object"
              },
              "typeParameters": []
            },
            {
              "name": "onAttacked",
              "settable": false,
              "type": {
                "parameters": [
                  {
                    "name": "handler",
                    "type": {
                      "parameters": [
                        {
                          "name": "obj",
                          "type": {
                            "definitionName": "AttackedEvent",
                            "typeArguments": [],
                            "kind": "Object"
                          }
                        }
                      ],
                      "returnType": {
                        "name": "Void",
                        "kind": "TypeReference"
                      },
                      "kind": "Func"
                    }
                  }
                ],
                "returnType": {
                  "name": "Void",
                  "kind": "TypeReference"
                },
                "kind": "Func"
              },
              "typeParameters": []
            }
          ],
          "typeParameters": [],
          "kind": "ObjectDefinition"
        }
      },
      {
        "name": "AttackedEvent",
        "type": {
          "name": "AttackedEvent",
          "base": null,
          "members": [
            {
              "name": "attacker",
              "settable": false,
              "type": {
                "definitionName": "Npc",
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
        "name": "npcs",
        "type": {
          "definitionName": "List",
          "typeArguments": [
            {
              "definitionName": "Npc",
              "typeArguments": [],
              "kind": "Object"
            }
          ],
          "kind": "Object"
        }
      },
      {
        "name": "player",
        "type": {
          "definitionName": "Player",
          "typeArguments": [],
          "kind": "Object"
        }
      }
    ],
    "collectionDefinition": "List",
    "booleanDefinition": "Boolean"
  }
  
  
`;
