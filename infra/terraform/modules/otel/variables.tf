variable "namespace" {
  type = string
}

variable "grafana_endpoint" {
  type = string
}

variable "prometheus_remote_write" {
  type = string
}

variable "env" {
  type = string
}

variable "selectors" {
  type = list(object({ key = string, value = string }))
}

variable "tags" {
  type    = map(string)
  default = {}
}
