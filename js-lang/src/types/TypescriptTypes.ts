export type Type =
  | UnionType
  | LiteralType
  | FuncType
  | ObjectType
  | UnknownType
  | NeverType
  | GenericType
  | GenericParameterType;

export interface UnknownType {
  readonly kind: "Unknown";
}

export interface NeverType {
  readonly kind: "Never";
}

export interface UnionType {
  readonly kind: "Union";
  readonly types: Type[];
}

export interface LiteralType {
  readonly kind: "Literal";
  readonly value: any;
  readonly valueType: Type;
}

export interface GenericTypeDefinition {
  readonly kind: "GenericTypeDefinition";
  readonly typeParameters: GenericParameterType[];
  readonly base: ObjectType | null;
  readonly members: Array<ObjectMember>;
  readonly name: string;
}

export interface GenericType {
  readonly kind: "Generic";
  readonly definition: GenericTypeDefinition;
  readonly typeArguments: Type[];
}

export interface GenericParameterType {
  readonly kind: "GenericParameter";
  readonly name: string;
}

export interface ObjectType {
  readonly kind: "Object";
  readonly base: ObjectType | null;
  readonly members: Array<ObjectMember>;
  readonly name: string;
}

export interface ObjectMember {
  readonly isConst: boolean;
  readonly name: string;
  readonly type: Type;
}

export interface FuncType {
  readonly kind: "Func";
  readonly parameters: readonly FuncParameter[];
  readonly returnType: Type;
}

export interface FuncParameter {
  readonly name: string;
  readonly type: Type;
}