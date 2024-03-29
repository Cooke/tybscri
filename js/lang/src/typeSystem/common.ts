export interface Type {
  readonly displayName: string;

  readonly members: Array<Member>;

  isAssignableFrom(type: Type): boolean;

  bind(bindings: TypeParameterBinding[]): Type;
}

export interface DefinitionType extends Type {
  readonly name: string;

  createType(typeArguments: Type[]): Type;
}

export function isDefinitionType(type: Type): type is DefinitionType {
  return "name" in type && "createType" in type;
}

export enum MemberFlag {
  Const,
  Operator,
}

export class Member {
  constructor(
    readonly flags: MemberFlag[],
    readonly name: string,
    readonly type: Type,
    readonly typeParameters?: TypeParameter[]
  ) {}

  bindTypes(bindings: TypeParameterBinding[]): Member {
    const newType = this.type.bind(bindings);
    return new Member(this.flags, this.name, newType, this.typeParameters);
  }
}

export type TypeParameterVariance = "in" | "out" | undefined;

export class TypeParameter implements DefinitionType {
  constructor(
    readonly name: string,
    readonly variance?: TypeParameterVariance
  ) {}

  createType(typeArguments: Type[]): Type {
    return this;
  }

  public readonly members: Array<Member> = [];

  public get displayName() {
    return this.name;
  }

  isAssignableFrom(type: Type): boolean {
    return this === type;
  }

  bind(bindings: TypeParameterBinding[]): Type {
    return bindings.find((x) => x.parameter === this)?.to ?? this;
  }
}

export interface TypeParameterBinding {
  parameter: TypeParameter;
  to: Type;
}
