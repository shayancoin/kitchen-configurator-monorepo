variable "env" {
  type = string
}

variable "tags" {
  type    = map(string)
  default = {}
}

variable "aurora_master_username" {
  type        = string
  default     = "fusion_admin"
  description = "Username for Aurora Postgres admin."
}

variable "redis_username" {
  type    = string
  default = "fusion_cache"
}

variable "kafka_username" {
  type    = string
  default = "fusion_events"
}
