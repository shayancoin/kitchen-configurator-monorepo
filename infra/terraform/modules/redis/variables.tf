variable "vpc_id" {
  type = string
}

variable "subnet_ids" {
  type = list(string)
}

variable "auth_token" {
  type      = string
  sensitive = true
}

variable "node_type" {
  type = string
}

variable "engine_version" {
  type = string
}

variable "allowed_security_groups" {
  type    = list(string)
  default = []
}

variable "tags" {
  type    = map(string)
  default = {}
}
