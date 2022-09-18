export type Type =
  | UnionType
  | LiteralType
  | FuncType
  | ObjectType
  | UnknownType
  | NeverType
  | TypeParameter;

interface TypeBase {
  readonly displayName: string;

  readonly members: Array<Member>;

  isAssignableFrom(type: Type): boolean;
}

export class UnknownType implements TypeBase {
  public static readonly instance = new UnknownType();

  public readonly members: Array<Member> = [];

  public readonly displayName = "unknown";

  isAssignableFrom(type: Type): boolean {
    return false;
  }

  private constructor() {}
}

export class NeverType implements TypeBase {
  public static readonly instance = new NeverType();

  public readonly members: Array<Member> = [];

  public readonly displayName = "never";

  private constructor() {}

  isAssignableFrom(type: Type): boolean {
    return false;
  }
}

export class UnionType implements TypeBase {
  public static create(types: Type[]) {
    if (types.length === 0) {
      return NeverType.instance;
    }

    function getFlattenTypes(type: Type): Type[] {
      if (type instanceof UnionType) {
        return type.types.reduce<Type[]>(
          (p, c) => [...p, ...getFlattenTypes(c)],
          []
        );
      }

      return [type];
    }

    const testTypes = types
      .reduce<Type[]>((p, c) => [...p, ...getFlattenTypes(c)], [])
      .filter((x) => x !== NeverType.instance);

    const resultTypes: Type[] = [];
    for (const type of testTypes) {
      if (!resultTypes.some((t) => t.isAssignableFrom(type))) {
        for (let i = resultTypes.length - 1; i >= 0; i--) {
          if (type.isAssignableFrom(resultTypes[i])) {
            resultTypes.splice(i, 1);
          }
        }

        resultTypes.push(type);
      }
    }

    if (resultTypes.length === 1) {
      return resultTypes[0];
    }

    return new UnionType(resultTypes);
  }

  private constructor(readonly types: Type[]) {}

  public get members(): Array<Member> {
    if (this.types.length === 0) {
      return [];
    }

    const members = this.types[0].members.reduce<{
      [key: string]: Member;
    }>((o, member) => {
      o[member.name] = member;
      return o;
    }, {});

    for (let i = 1; i < this.types.length; i++) {
      for (const member of this.types[i].members) {
        if (
          members[member.name] &&
          (!members[member.name].type.isAssignableFrom(member.type) ||
            members[member.name].isConst !== member.isConst)
        ) {
          delete members[member.name];
        }
      }
    }

    return Object.values(members);
  }

  public get displayName(): string {
    return this.types.map((x) => x.displayName).join(" | ");
  }

  isAssignableFrom(from: Type): boolean {
    return from instanceof UnionType
      ? from.types.every((ft) => this.types.some((t) => t.isAssignableFrom(ft)))
      : this.types.some((t) => t.isAssignableFrom(from));
  }
}

export class LiteralType implements TypeBase {
  constructor(readonly value: any, readonly valueType: Type) {}

  public get members(): Array<Member> {
    return this.valueType.members;
  }

  public get displayName(): string {
    return typeof this.value === "string"
      ? '"' + this.value.toString() + '"'
      : this.value.toString();
  }

  isAssignableFrom(type: Type): boolean {
    return (
      type instanceof LiteralType &&
      type.valueType === this.valueType &&
      this.value === type.value
    );
  }
}

export class FuncType implements TypeBase {
  constructor(
    readonly parameters: readonly FuncParameter[],
    readonly returnType: Type
  ) {}

  public readonly members: Array<Member> = [];

  public get displayName(): string {
    return `(${this.parameters.map(
      (p) => `${p.name}: ${p.type.displayName}`
    )}) => ${this.returnType.displayName}`;
  }

  public isAssignableFrom(from: Type): boolean {
    return (
      from instanceof FuncType &&
      this.returnType.isAssignableFrom(from.returnType) &&
      this.parameters.length >= from.parameters.length &&
      from.parameters.every((fp, i) =>
        fp.type.isAssignableFrom(this.parameters[i].type)
      )
    );
  }
}

export class FuncParameter {
  constructor(readonly name: string, readonly type: Type) {}
}

export class ObjectType implements TypeBase {
  constructor(
    readonly name: string,
    readonly base: ObjectType | null,
    private readonly membersThunk: () => Array<Member>
  ) {}

  private _directMembers?: Array<Member>;

  protected get directMembers(): Array<Member> {
    if (!this._directMembers) {
      this._directMembers = this.membersThunk();
    }
    return this._directMembers;
  }

  public get members(): Array<Member> {
    return this.directMembers.concat(this.base ? this.base.members : []);
  }

  public get displayName() {
    return this.name;
  }

  isAssignableFrom(from: Type): boolean {
    if (from instanceof ObjectType) {
      return isObjectAssignableToObject(from, this);
    } else if (from instanceof UnionType) {
      return from.types.every((t) => this.isAssignableFrom(t));
    } else if (from instanceof LiteralType) {
      return this.isAssignableFrom(from.valueType);
    }

    return false;
  }
}

function isObjectAssignableToObject(
  from: ObjectType | null,
  to: ObjectType
): boolean {
  if (!from) {
    return false;
  }

  if (from.name !== to.name) {
    return isObjectAssignableToObject(from.base, to);
  }

  if (
    !(from instanceof GenericObjectType) ||
    !(to instanceof GenericObjectType)
  ) {
    return true;
  }

  for (let i = 0; i < from.typeArguments.length; i++) {
    const fromArg = from.typeArguments[i];
    const toArg = to.typeArguments[i];
    const parameter = from.typeParameters[i];
    if (!isTypeArgumentAssignableToType(parameter.variance, fromArg, toArg)) {
      return false;
    }
  }

  return true;
}

export function areTypesEqual(left: Type, right: Type) {
  return left.isAssignableFrom(right) && right.isAssignableFrom(left);
}

// Exampele:
// out: Generic<Parent> var1 = Generic<Child>()
// in:  Generic<Child> var1 = Generic<Parent>()
function isTypeArgumentAssignableToType(
  variance: TypeParameterVariance,
  from: Type,
  to: Type
) {
  switch (variance) {
    // Invariant
    case undefined:
    case null:
      return areTypesEqual(from, to);

    // Contravariant
    case "in":
      return from.isAssignableFrom(to);

    // Convariant
    case "out":
      return to.isAssignableFrom(from);
  }
}

export class GenericObjectType extends ObjectType {
  bind(bindings: TypeParameterBinding[]) {
    const typeArguments = this.typeArguments.map((param) => {
      return bindings.find((ass) => ass.parameter === param)?.to ?? param;
    });

    return new GenericObjectType(
      this.name,
      this.base,
      () => this.directMembers,
      typeArguments,
      this.typeParameters
    );
  }

  constructor(
    name: string,
    base: ObjectType | null,
    membersThunk: () => Array<Member>,
    readonly typeArguments: Type[],
    readonly typeParameters: TypeParameter[]
  ) {
    super(name, base, membersThunk);
  }

  public getTypeAssignments(): TypeParameterBinding[] {
    return this.typeParameters.map((parameter, index) => ({
      parameter,
      to: this.typeArguments[index],
    }));
  }

  public get members(): Array<Member> {
    const typeAssignments = this.getTypeAssignments();
    return super.directMembers
      .map(
        (member) =>
          new Member(
            member.isConst,
            member.name,
            bindType(member.type, typeAssignments),
            member.typeParameters
          )
      )
      .concat(this.base ? this.base.members : []);
  }

  public get displayName(): string {
    const typeArgsOrParams = this.typeArguments ?? this.typeParameters;
    const suffix = typeArgsOrParams
      ? `<${typeArgsOrParams.map((x) => x.displayName).join(", ")}>`
      : "";
    return `${this.name}${suffix}`;
  }
}

export function bindType(type: Type, bindings: TypeParameterBinding[]): Type {
  if (type instanceof ObjectType) {
    return bindObjectType(type, bindings);
  } else if (type instanceof FuncType) {
    return bindFuncType(type, bindings);
  } else if (type instanceof TypeParameter) {
    return bindings.find((x) => x.parameter === type)?.to ?? type;
  }

  return type;
}

function bindFuncType(
  type: FuncType,
  bindings: TypeParameterBinding[]
): FuncType {
  return new FuncType(
    type.parameters.map(
      (param) => new FuncParameter(param.name, bindType(param.type, bindings))
    ),
    bindType(type.returnType, bindings)
  );
}

export function bindGenericObjectType(
  type: GenericObjectType,
  typeArguments: Type[]
): GenericObjectType {
  if (type.typeParameters.length !== typeArguments.length) {
    throw new Error("Type argument mismatch when binding type");
  }

  return new GenericObjectType(
    type.name,
    type.base,
    () => type.members,
    typeArguments,
    type.typeParameters
  );
}

function bindObjectType(type: ObjectType, bindings: TypeParameterBinding[]) {
  if (!(type instanceof GenericObjectType)) {
    return type;
  }

  return type.bind(bindings);
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

export class TypeParameter implements TypeBase {
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
}

export interface TypeParameterBinding {
  parameter: TypeParameter;
  to: Type;
}
