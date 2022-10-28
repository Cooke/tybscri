import {
  DefinitionType,
  FuncParameter,
  FuncType,
  LiteralType,
  Member,
  ObjectDefinitionType,
  ObjectType,
  Type,
  TypeParameter,
  TypeParameterVariance,
} from "..";
import { Environment, EnvironmentSymbol } from "../../common";

interface EnvironmentData {
  symbols: EnvironmentSymbolData[];
}

interface EnvironmentSymbolData {
  name: string;
  type: TypeData;
}

type TypeData =
  | ObjectDefinitionData
  | FuncTypeData
  | ObjectTypeData
  | LiteralTypeData
  | TypeParameterData;

interface LiteralTypeData {
  kind: "Literal";
  value: string | number | boolean;
  valueType: ObjectTypeData;
}

interface ObjectTypeData {
  kind: "Object";
  definitionName: string;
  typeArguments: TypeData[];
}
interface FuncTypeData {
  kind: "Func";
  parameters: FuncParameterData[];
  returnType: TypeData;
}

interface FuncParameterData {
  name: string;
  type: TypeData;
}

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

type TypeParameterVarianceData = "None" | "In" | "Out";

interface TypeParameterData {
  kind: "TypeParameter";
  name: string;
  variance: TypeParameterVarianceData;
}

interface DefinitionTable {
  readonly [key: string]: ObjectDefinitionType;
}

export function deserialize(environmentJson: string) {
  var env: EnvironmentData = JSON.parse(environmentJson);
  var definitionTable: { [name: string]: ObjectDefinitionType } = {};
  const symbols = env.symbols.map((symbol): EnvironmentSymbol => {
    const type = convertType(symbol.type, definitionTable);
    if (type instanceof ObjectDefinitionType) {
      definitionTable[type.name] = type;
    }

    return {
      name: symbol.name,
      type: type,
    };
  });
}

function convertType(type: TypeData, definitionTable: DefinitionTable): Type {
  switch (type.kind) {
    case "ObjectDefinition":
      return new ObjectDefinitionType(
        type.name,
        type.base ? definitionTable[type.base].createType([]) : null,
        type.typeParameters.map(
          (x) => new TypeParameter(x.name, convertVariance(x.variance))
        ),
        () => type.members.map((m) => convertMember(m, definitionTable))
      );

    case "Func":
      return new FuncType(
        type.parameters.map(
          (p) => new FuncParameter(p.name, convertType(p.type, definitionTable))
        ),
        convertType(type.returnType, definitionTable)
      );

    case "Object":
      return new ObjectType(
        definitionTable[type.definitionName],
        type.typeArguments.map((x) => convertType(x, definitionTable))
      );

    case "Literal":
      return new LiteralType(
        type.value,
        convertType(type.valueType, definitionTable)
      );

    case "TypeParameter":
      return new TypeParameter(type.name, convertVariance(type.variance));

    default:
      throw new Error("Could not convert type");
  }
}

function convertMember(member: MemberData, definitionTable: DefinitionTable) {
  return new Member(
    !member.settable,
    member.name,
    convertType(member.type, definitionTable),
    member.typeParameters.map(
      (x) => new TypeParameter(x.name, convertVariance(x.variance))
    )
  );
}

function convertVariance(
  data: TypeParameterVarianceData
): TypeParameterVariance {
  switch (data) {
    case "In":
      return "in";

    case "Out":
      return "out";

    case "None":
      return undefined;

    default:
      throw new Error("Unknown type parameter variance: " + data);
  }
}
