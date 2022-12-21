import { LiteralType } from "./LiteralType";
import { UnionType } from "./UnionType";
import {
  Type,
  Member,
  TypeParameter,
  TypeParameterBinding,
  TypeParameterVariance,
} from "./common";
import { DefinitionType } from ".";

export class ObjectDefinitionType implements DefinitionType {
  constructor(
    public readonly name: string,
    public readonly base: ObjectType | null,
    public readonly typeParameters: TypeParameter[],
    private readonly instanceDirectMembersThunk: () => Member[]
  ) {
    this.displayName = name;
  }

  public readonly displayName: string;

  public readonly members: Member[] = [];

  public get instanceDirectMembers() {
    return this.instanceDirectMembersThunk();
  }

  isAssignableFrom(type: Type): boolean {
    return false;
  }

  bind(bindings: TypeParameterBinding[]): Type {
    throw new Error("Method not implemented.");
  }

  createType(typeArguments?: Type[]): ObjectType {
    return new ObjectType(this, typeArguments ?? []);
  }
}

export class ObjectType implements Type {
  private readonly _directMembersThunk: () => Member[];
  private _directMembers?: Array<Member>;
  private readonly base: ObjectType | null;
  public readonly name: string;
  public readonly typeParameters: TypeParameter[];
  public readonly typeArguments: Type[];

  constructor(
    public readonly definition: ObjectDefinitionType,
    typeArguments?: Type[]
  ) {
    this.typeArguments = typeArguments ?? [];

    if (definition.typeParameters?.length !== typeArguments?.length) {
      throw new Error("Invalid number of type arguments");
    }

    var bindings = definition.typeParameters.map<TypeParameterBinding>(
      (p, i) => ({ parameter: p, to: typeArguments[i] })
    );

    this._directMembersThunk = () =>
      definition.instanceDirectMembers.map((m) => m.bindTypes(bindings));

    this.typeParameters = definition.typeParameters;
    this.name = definition.name;
    this.base = definition.base;
  }

  protected get directMembers(): Array<Member> {
    if (!this._directMembers) {
      this._directMembers = this._directMembersThunk();
    }
    return this._directMembers;
  }

  public get members(): Array<Member> {
    return this.directMembers.concat(this.base ? this.base.members : []);
  }

  public get displayName(): string {
    const typeArgsOrParams = this.typeArguments ?? this.typeParameters;
    const suffix =
      typeArgsOrParams && typeArgsOrParams.length > 0
        ? `<${typeArgsOrParams.map((x) => x.displayName).join(", ")}>`
        : "";
    return `${this.name}${suffix}`;
  }

  public isAssignableFrom(from: Type): boolean {
    if (from instanceof ObjectType) {
      return this.isAssignableFromObject(from);
    } else if (from instanceof UnionType) {
      return from.types.every((t) => this.isAssignableFrom(t));
    } else if (from instanceof LiteralType) {
      return this.isAssignableFrom(from.valueType);
    }

    return false;
  }

  private isAssignableFromObject(from: ObjectType): boolean {
    if (from.definition !== this.definition) {
      return !!from.base && this.isAssignableFromObject(from.base);
    }

    for (let i = 0; i < from.typeArguments.length; i++) {
      const fromArg = from.typeArguments[i];
      const toArg = this.typeArguments[i];
      const parameter = from.typeParameters[i];
      if (!isTypeArgumentAssignableToType(parameter.variance, fromArg, toArg)) {
        return false;
      }
    }

    return true;
  }

  public bind(bindings: TypeParameterBinding[]): Type {
    if (this.typeParameters.length === 0) {
      return this;
    }

    const typeArguments = this.typeArguments.map((param) => {
      return bindings.find((ass) => ass.parameter === param)?.to ?? param;
    });

    return new ObjectType(this.definition, typeArguments);
  }

  public bindAll(typeArguments: Type[]) {
    if (this.typeParameters.length !== typeArguments.length) {
      throw new Error("Type argument mismatch when binding type");
    }

    return new ObjectType(this.definition, typeArguments);
  }
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
      return from.isAssignableFrom(to) && to.isAssignableFrom(from);

    // Contravariant
    case "in":
      return from.isAssignableFrom(to);

    // Convariant
    case "out":
      return to.isAssignableFrom(from);
  }
}
