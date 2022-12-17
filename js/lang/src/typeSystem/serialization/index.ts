import {
  createUnionType,
  DefinitionType,
  FuncParameter,
  FuncType,
  isDefinitionType,
  LiteralType,
  Member,
  NeverDefinitionType,
  NeverType,
  ObjectDefinitionType,
  ObjectType,
  Type,
  TypeParameter,
  TypeParameterVariance,
  UnionType,
  VoidDefinitionType,
} from "..";
import { Environment, EnvironmentSymbol } from "../../common";
import { AnyDefinitionType } from "../AnyType";

interface EnvironmentData {
  symbols: EnvironmentSymbolData[];
  collectionDefinition: string;
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
  | TypeReferenceData
  | UnionTypeData
  | NeverTypeDefinitionData
  | VoidTypeDefinitionData
  | AnyTypeDefinitionData;

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
  name: string;
  variance: TypeParameterVarianceData;
}

interface TypeReferenceData {
  kind: "TypeReference";
  name: string;
}

interface UnionTypeData {
  kind: "Union";
  types: TypeData[];
}

interface NeverTypeDefinitionData {
  kind: "NeverDefinition";
  name: string;
}

interface VoidTypeDefinitionData {
  kind: "VoidDefinition";
  name: string;
}

interface AnyTypeDefinitionData {
  kind: "AnyDefinition";
  name: string;
}

interface TypeResolver {
  (name: string): DefinitionType | null | undefined;
}

export function createEnvironment(envData: EnvironmentData): Environment {
  var definitionTable: { [name: string]: DefinitionType } = {};
  var typeResolver: TypeResolver = (name) => {
    if (!definitionTable[name]) {
      throw new Error("Unknown type: " + name);
    }

    return definitionTable[name];
  };
  const symbols = envData.symbols.map((symbol): EnvironmentSymbol => {
    const type = convertType(symbol.type, typeResolver);
    if (isDefinitionType(type)) {
      definitionTable[type.name] = type;
    }

    return {
      name: symbol.name,
      type: type,
    };
  });
  return {
    symbols,
    collectionDefinition: resolveDefinition(
      envData.collectionDefinition,
      typeResolver
    ),
  };
}

export function parseEnvironment(json: string): Environment {
  var envData: EnvironmentData = JSON.parse(json);
  return createEnvironment(envData);
}

function convertType(type: TypeData, typeResolver: TypeResolver): Type {
  switch (type.kind) {
    case "ObjectDefinition":
      const typeParameters = type.typeParameters.map(
        (x) => new TypeParameter(x.name, convertVariance(x.variance))
      );
      const innerResolver: TypeResolver = (x) =>
        typeParameters.find((p) => p.name === x) ?? typeResolver(x);
      return new ObjectDefinitionType(
        type.name,
        type.base
          ? resolveDefinition(type.base, typeResolver).createType([])
          : null,
        typeParameters,
        () => type.members.map((m) => convertMember(m, innerResolver))
      );

    case "Func":
      return new FuncType(
        type.parameters.map(
          (p) => new FuncParameter(p.name, convertType(p.type, typeResolver))
        ),
        convertType(type.returnType, typeResolver)
      );

    case "Object":
      return new ObjectType(
        resolveDefinition(type.definitionName, typeResolver),
        type.typeArguments.map((x) => convertType(x, typeResolver))
      );

    case "Literal":
      return new LiteralType(
        type.value,
        convertType(type.valueType, typeResolver)
      );

    case "TypeReference":
      const referencedType = typeResolver(type.name);
      if (!referencedType) {
        throw new Error("Could not find referenced type: " + type.name);
      }

      return referencedType.createType([]);

    case "Union":
      return createUnionType(
        ...type.types.map((x) => convertType(x, typeResolver))
      );

    case "NeverDefinition":
      return new NeverDefinitionType(type.name);

    case "VoidDefinition":
      return new VoidDefinitionType(type.name);

    case "AnyDefinition":
      return new AnyDefinitionType(type.name);

    default:
      throw new Error("Could not convert type");
  }
}

function convertMember(member: MemberData, typeResolver: TypeResolver) {
  return new Member(
    !member.settable,
    member.name,
    convertType(member.type, typeResolver),
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

function resolveDefinition(name: string, typeResolver: TypeResolver) {
  const type = typeResolver(name);
  if (!(type instanceof ObjectDefinitionType)) {
    throw new Error("Type is not a definition type");
  }

  return type;
}
