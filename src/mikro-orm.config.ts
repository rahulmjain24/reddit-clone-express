import { defineConfig } from "@mikro-orm/postgresql";
import { __prod__ } from "./constants";
import { Post } from "./entities/Post";
import path from "path";
import { User } from "./entities/User";

export default defineConfig({
  migrations: {
    path: path.join(__dirname, './migrations'),
    glob: '!(*.d).{js,ts}',
  },
  entities: [Post, User],
  dbName: 'reddit',
  user: 'postgres',
  debug: !__prod__,
  allowGlobalContext: true,
})