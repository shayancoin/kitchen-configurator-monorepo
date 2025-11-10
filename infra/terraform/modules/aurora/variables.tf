variable "cluster_identifier" {
  type = string
}

variable "subnet_ids" {
  type = list(string)
}

variable "security_group_ids" {
  type    = list(string)
  default = []
}

variable "master_username" {
  type = string
}

variable "master_password" {
  type      = string
  sensitive = true
}

variable "engine_version" {
  type    = string
  default = "15.4"
}

variable "instance_class" {
  type    = string
  default = "db.serverless"
}

variable "shard_count" {
  type    = number
  default = 4
}

variable "tags" {
  type    = map(string)
  default = {}
}

variable "kms_key_arn" {
  description = "ARN of the customer managed KMS key used for encrypting the Aurora cluster and instances."
  type        = string
}

variable "deletion_protection" {
  description = "When true, prevents the Aurora cluster from being deleted accidentally."
  type        = bool
  default     = true
}
