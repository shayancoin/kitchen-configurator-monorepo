locals {
  collector_config = <<-YAML
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  memory_limiter:
    limit_percentage: 80
    spike_limit_percentage: 25
    check_interval: 2s
  batch:
    timeout: 5s
    send_batch_size: 512
  tail_sampling:
    decision_wait: 10s
    num_traces: 5000
    expected_new_traces_per_sec: 1000
    policies:
      - name: errors
        type: status_code
        status_code:
          status_codes: [ERROR]
      - name: slow-path
        type: latency
        latency:
          threshold: 300ms
  spanmetrics:
    metrics_flush_interval: 15s
    dimensions:
      - name: http.method
      - name: http.route

exporters:
  logging:
    loglevel: warn
  otlphttp/grafana:
    endpoint: ${var.grafana_endpoint}
    tls:
      insecure: true
  prometheusremotewrite:
    endpoint: ${var.prometheus_remote_write}

service:
  telemetry:
    logs:
      level: info
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, tail_sampling, batch]
      exporters: [otlphttp/grafana, logging, spanmetrics]
    metrics/spanmetrics:
      receivers: [spanmetrics]
      exporters: [prometheusremotewrite]
  extensions: []
YAML
}

resource "helm_release" "collector" {
  name             = "otel-collector"
  repository       = "https://open-telemetry.github.io/opentelemetry-helm-charts"
  chart            = "opentelemetry-collector"
  namespace        = var.namespace
  create_namespace = true

  values = [
    yamlencode({
      mode             = "deployment"
      fullnameOverride = "otel-${var.env}"
      image = {
        repository = "otel/opentelemetry-collector-contrib"
      }
      config = local.collector_config
      podLabels = {
        env = var.env
      }
      service = {
        type = "ClusterIP"
        annotations = {
          "mesh.istio.io/exportTo" = "."
        }
        labels = {
          app = "otel-collector"
        }
      }
      tolerations = [{
        key      = "workload"
        operator = "Equal"
        value    = "observability"
        effect   = "NoSchedule"
      }]
      nodeSelector = {
        "kubernetes.io/os" = "linux"
      }
    })
  ]
}
