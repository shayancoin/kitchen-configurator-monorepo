import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { buildSubgraphSchema } from "@apollo/subgraph";
import { startNodeTelemetry } from "@repo/observability/otel-node";
import crypto from "crypto";
import { typeDefs } from "@repo/shared-sdl";
import { resolvers, type ResolverContext } from "./resolvers";

const port = Number(process.env.PORT ?? 4100);

const server = new ApolloServer<ResolverContext>({
  schema: buildSubgraphSchema([{ typeDefs, resolvers }]),
  introspection: true
});

const bootstrap = async () => {
  startNodeTelemetry();
  const { url } = await startStandaloneServer(server, {
    listen: { port },
    context: async () => ({
      requestId: crypto.randomUUID()
    })
  });

  console.log(`[gateway] GraphQL federation bootstrap complete at ${url}`);
};

bootstrap().catch((error) => {
  console.error("[gateway] failed to start", error);
  process.exitCode = 1;
});
