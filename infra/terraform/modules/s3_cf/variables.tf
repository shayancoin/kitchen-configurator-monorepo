variable "bucket_name" {
  type = string
}

variable "domain_name" {
  type = string
}

variable "graphql_origin" {
  type = string
}

variable "acm_cert_arn" {
  type = string
}

variable "cache_ttl_seconds" {
  type    = number
  default = 86400
}

variable "graphql_edge_path" {
  type    = string
  default = "/graphql"
}

variable "tags" {
  type    = map(string)
  default = {}
}
