import http from "k6/http";
import { Trend } from "k6/metrics";
import { check, sleep } from "k6";

const baseUrl = __ENV.KITCHEN_BASE_URL ?? "http://localhost:3000";
const locale = __ENV.KITCHEN_LOCALE ?? "en";

const configuratorTTFB = new Trend("configurator_ttfb", true);
const graphQLDuration = new Trend("graphql_hot_duration", true);

export const options = {
  vus: Number(__ENV.K6_VUS ?? 5),
  duration: __ENV.K6_DURATION ?? "1m",
  thresholds: {
    http_req_duration: ["p(95)<2000"],
    configurator_ttfb: ["avg<500"],
    graphql_hot_duration: ["p(95)<300"]
  }
};

const graphqlPayload = JSON.stringify({
  query: `
    query ConfiguratorPrefetch {
      catalogModules {
        id
        name
        description
      }
    }
  `
});

const headers = {
  "Content-Type": "application/json",
  Accept: "application/json"
};

export default function smoke() {
  const previewResponse = http.get(`${baseUrl}/${locale}/configurator`, {
    tags: { name: "ConfiguratorPreview" }
  });

  configuratorTTFB.add(previewResponse.timings.waiting);
  check(previewResponse, {
    "preview status 200": (res) => res.status === 200,
    "preview hydrated": (res) => res.body && res.body.length > 1024
  });

  const graphqlResponse = http.post(`${baseUrl}/graphql`, graphqlPayload, {
    headers,
    tags: { name: "ConfiguratorGraphQL" }
  });

  graphQLDuration.add(graphqlResponse.timings.duration);
  check(graphqlResponse, {
    "graphql status 200": (res) => res.status === 200,
    "graphql body": (res) => Boolean(res.json()?.data),
    "graphql no errors": (res) => !res.json()?.errors || res.json().errors.length === 0
  });

  sleep(Number(__ENV.K6_SLEEP ?? 1));
}
