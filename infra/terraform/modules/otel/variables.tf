variable "namespace" {
  description = "Kubernetes namespace where the OpenTelemetry collector should be installed."
  type        = string

  validation {
    condition     = length(trimspace(var.namespace)) > 0
    error_message = "namespace must be a non-empty string."
  }
}

variable "grafana_endpoint" {
  description = "HTTP(S) endpoint for the Grafana/Tempo OTLP HTTP receiver."
  type        = string

  validation {
    condition     = can(regex("^https?://", var.grafana_endpoint))
    error_message = "grafana_endpoint must be a valid http or https URL."
  }
}

variable "prometheus_remote_write" {
  description = "HTTP(S) endpoint for Prometheus remote write traffic."
  type        = string

  validation {
    condition     = can(regex("^https?://", var.prometheus_remote_write))
    error_message = "prometheus_remote_write must be a valid http or https URL."
  }
}

variable "env" {
  description = "Short environment label applied to OTEL resources."
  type        = string

  validation {
    condition     = contains(["dev", "qa", "staging", "prod"], var.env)
    error_message = "env must be one of: dev, qa, staging, prod."
  }
}

variable "selectors" {
  description = "List of label selectors (key/value pairs) that scope OTEL scraping or routing behavior."
  type        = list(object({ key = string, value = string }))
}

variable "grafana_skip_verify" {
  description = "Set to true to skip TLS verification for the Grafana OTLP HTTP exporter (testing only)."
  type        = bool
  default     = false
}

variable "tags" {
  description = "Optional tags applied to supporting OTEL infrastructure."
  type        = map(string)
  default     = {}
}
