variable "namespace" {
  type = string
}

variable "mesh_id" {
  type = string
}

variable "ingress_dns" {
  type = string
}

variable "tags" {
  type    = map(string)
  default = {}
}
