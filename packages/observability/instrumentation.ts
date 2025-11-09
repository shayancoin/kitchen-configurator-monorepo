export const initializeSentry = async () => {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const [{ initializeSentry: initServer }, { startNodeTelemetry }] = await Promise.all([
      import("./server"),
      import("./otel-node")
    ]);
    initServer();
    startNodeTelemetry();
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    const { initializeSentry: initEdge } = await import("./edge");
    initEdge();
  }
};
