export interface Type {
  readonly displayName: string;

  readonly members: Array<Member>;

  isAssignableFrom(type: Type): boolean;

  bind(bindings: TypeParameterBinding[]): Type;
}

export class Member {
  constructor(
    readonly isConst: boolean,
    readonly name: string,
    readonly type: Type,
    readonly typeParameters?: TypeParameter[]
  ) {}
}

export type TypeParameterVariance = "in" | "out" | undefined;

export class TypeParameter implements Type {
  constructor(
    readonly name: string,
    readonly variance?: TypeParameterVariance
  ) {}

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
