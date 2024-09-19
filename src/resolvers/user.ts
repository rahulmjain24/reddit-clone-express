import { User } from "../entities/User";
import { MyContext } from "../types";
import { Arg, Ctx, Field, InputType, Mutation, ObjectType, Query, Resolver } from "type-graphql";
import argon2 from "argon2";

@InputType()
class UsernamePasswordInput {
  @Field()
  public username: string;

  @Field()
  public password: string;
}

@ObjectType()
class FieldError {
  constructor(field: string, message: string) {
    this.field = field;
    this.message = message;
  }

  @Field()
  field: string;

  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver()
export class UserResolver {
  @Query(() => User, { nullable: true })
  public async me(@Ctx() { req, em }: MyContext): Promise<User | null> {
    if (!req.session.userId) {
      return null;
    }
    const user = await em.findOne(User, { id: req.session.userId })
    return user;
  }

  @Mutation(() => UserResponse)
  public async register(
    @Arg('options') options: UsernamePasswordInput,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    if (options.username.length <= 2) {
      return {
        errors: [
          new FieldError('username', 'Length must be longer than 2')
        ]
      }
    }

    if (options.password.length <= 4) {
      return {
        errors: [
          new FieldError('password', 'Length must be longer than 5')
        ]
      }
    }
    const hashedPassword = await argon2.hash(options.password)
    const user = em.create(User, { username: options.username, password: hashedPassword });
    try {
      await em.persistAndFlush(user);
      req.session.userId = user.id;
    } catch (error) {
      // dupliacate user
      if (error.code === '23505') {
        return {
          errors: [new FieldError('username', 'User already exists')]
        }
      }
    }
    return {
      user,
    };
  }

  @Mutation(() => UserResponse)
  public async login(
    @Arg('options') options: UsernamePasswordInput,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    const user = await em.findOne(User, { username: options.username });
    if (!user) {
      return {
        errors: [new FieldError('username', 'User does not exist')]
      }
    }

    const valid = await argon2.verify(user.password, options.password);

    if (!valid) {
      return {
        errors: [new FieldError('password', 'Invalid password')]
      }
    }
    
    req.session.userId = user.id;

    return {
      user,
    };
  }
}