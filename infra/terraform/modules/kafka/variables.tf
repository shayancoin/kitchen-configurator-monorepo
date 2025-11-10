variable "cluster_name" {
  description = "Human-readable name assigned to the MSK cluster."
  type        = string
}

variable "kafka_version" {
  description = "Kafka broker version to deploy (e.g., 3.7.0)."
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs where the MSK brokers will be created."
  type        = list(string)
}

variable "security_group_ids" {
  description = "Security group IDs attached to the MSK broker network interfaces."
  type        = list(string)
}

variable "broker_nodes" {
  description = "Number of broker nodes for the MSK cluster."
  type        = number
}

variable "broker_instance_type" {
  description = "Instance type used for each MSK broker node."
  type        = string
  default     = "kafka.m7g.large"
}

variable "client_username" {
  description = "SCRAM username provisioned for MSK client authentication."
  type        = string
}

variable "client_password" {
  description = "SCRAM password provisioned for MSK client authentication."
  type        = string
  sensitive   = true
}

variable "tags" {
  description = "Tags applied to MSK and supporting resources."
  type        = map(string)
  default     = {}
}

variable "kms_key_arn" {
  description = "Customer managed KMS key ARN used for encrypting the MSK cluster at rest."
  type        = string
}

variable "log_kms_key_arn" {
  description = "KMS key ARN used to encrypt CloudWatch log groups created for MSK."
  type        = string
}

variable "secret_kms_key_arn" {
  description = "KMS key ARN used to encrypt the Secrets Manager secret storing MSK SCRAM credentials."
  type        = string
}
