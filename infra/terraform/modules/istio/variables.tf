variable "namespace" {
  description = "Kubernetes namespace where Istio control plane components are installed."
  type        = string

  validation {
    condition     = length(var.namespace) > 0 && length(var.namespace) <= 63 && can(regex("^[a-z0-9]([-a-z0-9]*[a-z0-9])?$", var.namespace))
    error_message = "namespace must be a non-empty Kubernetes DNS-1123 label (lowercase alphanumeric, start/end with alphanumeric, hyphen allowed in between) and at most 63 characters."
  }
}

variable "mesh_id" {
  description = "Logical mesh identifier shared by Istio components."
  type        = string

  validation {
    condition     = length(trimspace(var.mesh_id)) > 0 && can(regex("^[A-Za-z0-9-_]+$", var.mesh_id))
    error_message = "mesh_id must be non-empty and may only contain letters, numbers, dashes, or underscores."
  }
}

variable "ingress_dns" {
  description = "Fully qualified domain name served by the Istio ingress gateway."
  type        = string

  validation {
    condition     = length(trimspace(var.ingress_dns)) > 0 && can(regex("^([a-z0-9](?:[-a-z0-9]{0,61}[a-z0-9])?\\.)+[a-z]{2,63}$", lower(var.ingress_dns)))
    error_message = "ingress_dns must be a non-empty fully qualified domain name (lowercase letters, numbers, hyphens; labels 1-63 chars; total <=253)."
  }
}

variable "tags" {
  description = "Optional resource tags propagated to Istio AWS resources."
  type        = map(string)
  default     = {}
}
