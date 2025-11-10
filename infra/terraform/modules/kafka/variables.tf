variable "cluster_name" {
  type = string
}

variable "kafka_version" {
  type = string
}

variable "subnet_ids" {
  type = list(string)
}

variable "security_group_ids" {
  type = list(string)
}

variable "broker_nodes" {
  type = number
}

variable "broker_instance_type" {
  type    = string
  default = "kafka.m7g.large"
}

variable "client_username" {
  type = string
}

variable "client_password" {
  type      = string
  sensitive = true
}

variable "allow_plaintext" {
  type        = bool
  description = "Set to true only if legacy clients require PLAINTEXT traffic; enabling this reduces transport security."
  default     = false
}

variable "tags" {
  type    = map(string)
  default = {}
}
