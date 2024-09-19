import { MikroORM } from '@mikro-orm/core'
import { __prod__ } from './constants';
import mikroOrmConfig from './mikro-orm.config';
import express from 'express';
import { ApolloServer } from '@apollo/server';
import { buildSchema } from 'type-graphql';
import { HelloResolver } from './resolvers/hello';
import { expressMiddleware } from '@apollo/server/express4';
import { PostResolver } from './resolvers/post';
import { UserResolver } from './resolvers/user';
import ReddisStore from 'connect-redis';
import session from 'express-session';
import { createClient } from 'redis';
import { MyContext } from './types';

async function main() {
  const orm = await MikroORM.init(mikroOrmConfig);
  await orm.getMigrator().up();
  const app = express();

  const client = createClient();
  await client.connect();

  app.use(
    session({
      name: 'quid',
      store: new ReddisStore({
        client,
        disableTouch: true,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10,
        httpOnly: true,
        secure: __prod__,
        sameSite: 'lax',
      },
      saveUninitialized: false,
      secret: 'hola',
      resave: false,
    })
  )

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false,
    }),
  });
  await apolloServer.start();

  app.use(
    '/graphql',
    express.json(),
    expressMiddleware(apolloServer, {
      context: async ({ req, res }): Promise<MyContext> => ({ req, res, em: orm.em }),
    }),
  );

  app.listen(4000, () => {
    console.log('Server live on localhost:4000');
  })
}

main().catch((err) => console.error(err));