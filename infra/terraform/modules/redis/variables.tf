variable "vpc_id" {
  description = "ID of the VPC that hosts the ElastiCache replication group."
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs where the ElastiCache nodes should be placed."
  type        = list(string)
}

variable "auth_token" {
  description = "Authentication token used for Redis AUTH; treated as sensitive."
  type        = string
  sensitive   = true
}

variable "node_type" {
  description = "Instance type for the Redis nodes (e.g., cache.r7g.large)."
  type        = string
}

variable "engine_version" {
  description = "Redis engine version to deploy."
  type        = string
}

variable "allowed_security_groups" {
  description = "Security group IDs allowed to initiate connections to the Redis cluster."
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Tags applied to Redis resources."
  type        = map(string)
  default     = {}
}

variable "kms_key_arn" {
  description = "Customer managed KMS key ARN for encrypting the Redis replication group at rest."
  type        = string
}
