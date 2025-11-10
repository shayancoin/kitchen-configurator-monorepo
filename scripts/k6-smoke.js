import http from "k6/http";
import { Trend } from "k6/metrics";
import { check, sleep } from "k6";

// Use logical OR (||) instead of nullish coalescing (??) to ensure empty strings
// are properly replaced with defaults
const baseUrl = __ENV.KITCHEN_BASE_URL || "http://localhost:3000";
const locale = __ENV.KITCHEN_LOCALE || "en";

const configuratorTTFB = new Trend("configurator_ttfb", true);
const graphQLDuration = new Trend("graphql_hot_duration", true);

// Parse and validate K6_VUS with fallback to safe default
// K6 requires a positive integer for VU count
const parseVUs = (envValue) => {
  const parsed = Number(envValue);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 5;
};

export const options = {
  vus: parseVUs(__ENV.K6_VUS),
  duration: __ENV.K6_DURATION || "1m",
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

/**
 * Runs a K6 smoke test that exercises the configurator preview and GraphQL endpoints, records related performance metrics, and asserts basic response correctness.
 *
 * The function issues a GET to the configurator preview and records TTFB, then issues a POST to the GraphQL endpoint and records request duration. It also performs checks that the preview returns HTTP 200 and a sufficiently populated body, and that the GraphQL response returns HTTP 200 with a truthy `data` field and no reported errors. Finally, it sleeps for a configurable duration.
 */
export default function smoke() {
  const previewResponse = http.get(`${baseUrl}/${locale}/configurator`, {
    tags: { name: "ConfiguratorPreview" }
  });

  configuratorTTFB.add(previewResponse.timings.waiting);
  
  // Structural validation for SSR hydration markers
  // Check for presence of Next.js SSR container and bootstrap data
  const MIN_HYDRATED_HTML_BYTES = 1024; // Sanity check: hydrated HTML should be reasonably sized
  const isHydrated = (res) => {
    if (!res.body) return false;
    const hasSSRContainer = res.body.includes('<div id="__next">');
    const hasBootstrapData = res.body.includes('__NEXT_DATA__');
    const hasMinimalSize = res.body.length > MIN_HYDRATED_HTML_BYTES;
    return hasSSRContainer && hasBootstrapData && hasMinimalSize;
  };
  
  check(previewResponse, {
    "preview status 200": (res) => res.status === 200,
    "preview hydrated": isHydrated
  });

  const graphqlResponse = http.post(`${baseUrl}/graphql`, graphqlPayload, {
    headers,
    tags: { name: "ConfiguratorGraphQL" }
  });

  graphQLDuration.add(graphqlResponse.timings.duration);
  const gqlBody = graphqlResponse.json();
  check(graphqlResponse, {
    "graphql status 200": (res) => res.status === 200,
    "graphql body": () => Boolean(gqlBody?.data),
    "graphql no errors": () => !gqlBody?.errors || gqlBody.errors.length === 0
  });

  // Parse and validate K6_SLEEP duration with fallback to safe default
  const parseSleepDuration = (envValue) => {
    const parsed = parseFloat(envValue);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 1;
  };

  sleep(parseSleepDuration(__ENV.K6_SLEEP));
}