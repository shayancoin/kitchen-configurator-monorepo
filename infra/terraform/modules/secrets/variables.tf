variable "env" {
  description = "Deployment environment identifier (used for naming secrets)."
  type        = string
}

variable "tags" {
  description = "Tags applied to each Secrets Manager secret."
  type        = map(string)
  default     = {}
}

variable "aurora_master_username" {
  description = "Username for the Aurora PostgreSQL admin user stored in Secrets Manager."
  type        = string
  default     = "fusion_admin"
}

variable "redis_username" {
  description = "Username associated with the Redis auth token secret."
  type        = string
  default     = "fusion_cache"
}

variable "kafka_username" {
  description = "Username stored in the Kafka SCRAM secret for MSK authentication."
  type        = string
  default     = "fusion_events"
}

variable "kms_key_arn" {
  description = "Customer managed KMS key ARN used to encrypt all Secrets Manager secrets."
  type        = string
}

variable "rotation_lambda_arn" {
  description = "ARN of the Lambda function that performs secret rotation. When null, rotation is disabled."
  type        = string
  default     = null
}

variable "rotation_interval_days" {
  description = "Number of days between automatic secret rotations."
  type        = number
  default     = 30
}
