import { MyContext } from "src/types";
import { Post } from "../entities/Post";
import { Arg, Ctx, Mutation, Query, Resolver } from "type-graphql";

@Resolver()
export class PostResolver {
  @Query(() => [Post])
  public async posts(@Ctx() { em }: MyContext): Promise<Post[]> {
    return em.find(Post, {});
  }

  @Query(() => Post, { nullable: true })
  public async post(@Arg('id') id: number, @Ctx() { em }: MyContext): Promise<Post | null> {
    return em.findOne(Post, { id });
  }

  @Mutation(() => Post)
  public async createPost(@Arg('title') title: string, @Ctx() { em }: MyContext): Promise<Post> {
    const post = em.create(Post, { title });
    await em.persistAndFlush(post);
    return post;
  }

  @Mutation(() => Post)
  public async updatePost(@Arg('id') id: number, @Arg('title', () => String, { nullable: true }) title: string, @Ctx() { em }: MyContext): Promise<Post | null> {
    const post = await em.findOne(Post, { id });
    if (!post) {
      return null;
    }

    if (title) {
      post.title = title
      await em.persistAndFlush(post);
    }

    return post;
  }

  @Mutation(() => Boolean)
  public async deletePostById(@Arg('id') id: number, @Ctx() { em }: MyContext): Promise<boolean> {
    await em.nativeDelete(Post, { id });
    return true;
  }
}