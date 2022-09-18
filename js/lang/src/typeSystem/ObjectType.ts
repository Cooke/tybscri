import { LiteralType } from "./LiteralType";
import { UnionType } from "./UnionType";
import {
  Type,
  Member,
  TypeParameter,
  TypeParameterBinding,
  isTypeArgumentAssignableToType,
} from "./common";

export class ObjectType implements Type {
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

  public isAssignableFrom(from: Type): boolean {
    if (from instanceof ObjectType) {
      return isObjectAssignableToObject(from, this);
    } else if (from instanceof UnionType) {
      return from.types.every((t) => this.isAssignableFrom(t));
    } else if (from instanceof LiteralType) {
      return this.isAssignableFrom(from.valueType);
    }

    return false;
  }

  public bind(bindings: TypeParameterBinding[]): Type {
    return this;
  }
}

export class GenericObjectType extends ObjectType {
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
            member.type.bind(typeAssignments),
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
