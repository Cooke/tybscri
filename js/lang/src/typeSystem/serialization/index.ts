import { DefinitionType, Type } from "..";
import { Environment, EnvironmentSymbol } from "../../common";

interface EnvironmentData {
  symbols: EnvironmentSymbolData[];
}

interface EnvironmentSymbolData {
  name: string;
  type: TypeData;
}

type TypeData = ObjectDefinitionData;

interface ObjectDefinitionData {
  kind: "ObjectDefinition";
  name: string;
  base?: string | null;
  members: MemberData[];
  typeParameters: TypeParameterData[];
}

interface MemberData {
  name: string;
  settable: boolean;
  type: TypeData;
  typeParameters: TypeParameterData[];
}

interface TypeParameterData {
  name: string;
  variance: "None" | "In" | "Out";
}

interface DefinitionTable {
  [key: string]: DefinitionType;
}

export function deserialize(environmentJson: string) {
  var env: EnvironmentData = JSON.parse(environmentJson);
  var definitionTable: DefinitionTable = {};
  const symbols = env.symbols.map(
    (symbol): EnvironmentSymbol => ({
      name: symbol.name,
      type: convertType(symbol.type, definitionTable),
    })
  );
}
function convertType(type: TypeData, definitionTable: DefinitionTable): Type {
  switch (type.kind) {
    default:
      throw new Error("Could not convert type");
  }
}
