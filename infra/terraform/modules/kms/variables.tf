variable "alias" {
  description = "Friendly alias created for the customer managed CMK (without the alias/ prefix)."
  type        = string
}

variable "description" {
  description = "Human readable description associated with the CMK."
  type        = string
  default     = "Customer managed CMK for platform data plane encryption."
}

variable "service_principals" {
  description = "AWS service principals allowed to use the CMK for encryption and decryption."
  type        = list(string)
  default     = []
}

variable "additional_admin_arns" {
  description = "Optional IAM principal ARNs granted full administrative permissions on the CMK."
  type        = list(string)
  default     = []
}

variable "deletion_window_in_days" {
  description = "Waiting period (in days) before the CMK is scheduled for deletion."
  type        = number
  default     = 30
}

variable "enable_key_rotation" {
  description = "Whether to enable annual automatic key rotation on the CMK."
  type        = bool
  default     = true
}

variable "tags" {
  description = "Tags that should be applied to the CMK."
  type        = map(string)
  default     = {}
}
