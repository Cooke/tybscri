import { LiteralType } from "./LiteralType";
import { UnionType } from "./UnionType";
import {
  Type,
  Member,
  TypeParameter,
  TypeParameterBinding,
  TypeParameterVariance,
} from "./common";

export class ObjectType implements Type {
  private _directMembers?: Array<Member>;
  public typeParameters: TypeParameter[];
  public typeArguments: Type[];

  constructor(
    readonly name: string,
    readonly base: ObjectType | null,
    private readonly membersThunk: () => Array<Member>,
    typeArguments?: Type[],
    typeParameters?: TypeParameter[]
  ) {
    this.typeParameters = typeParameters ?? [];
    this.typeArguments = typeArguments ?? [];
  }

  protected get directMembers(): Array<Member> {
    if (!this._directMembers) {
      this._directMembers = this.membersThunk();
    }
    return this._directMembers;
  }

  public get members(): Array<Member> {
    const typeAssignments = this.typeParameters.map((parameter, index) => ({
      parameter,
      to: this.typeArguments[index],
    }));
    return this.directMembers
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
    if (from.name !== this.name) {
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

    return new ObjectType(
      this.name,
      this.base,
      this.membersThunk,
      typeArguments,
      this.typeParameters
    );
  }

  public bindAll(typeArguments: Type[]) {
    if (this.typeParameters.length !== typeArguments.length) {
      throw new Error("Type argument mismatch when binding type");
    }

    return new ObjectType(
      this.name,
      this.base,
      this.membersThunk,
      typeArguments,
      this.typeParameters
    );
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
