variable "region" {
  description = "AWS region for all infrastructure."
  type        = string
}

variable "enable_cloudfront" {
  description = "Toggle CloudFront/S3 distribution provisioning."
  type        = bool
  default     = true
}

variable "env" {
  description = "Environment label (dev/staging/prod)."
  type        = string
  default     = "staging"
}

variable "tags" {
  description = "Additional tags applied to every resource."
  type        = map(string)
  default     = {}
}

variable "vpc_cidr" {
  description = "CIDR block for the primary VPC."
  type        = string
  default     = "10.42.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "List of CIDRs for public subnets."
  type        = list(string)
  default     = ["10.42.0.0/20", "10.42.16.0/20", "10.42.32.0/20"]
}

variable "private_subnet_cidrs" {
  description = "List of CIDRs for private subnets."
  type        = list(string)
  default     = ["10.42.128.0/20", "10.42.144.0/20", "10.42.160.0/20"]
}

variable "cluster_name" {
  description = "EKS cluster name."
  type        = string
  default     = "parviz-configurator"
}

variable "kubernetes_version" {
  description = "EKS Kubernetes control plane version."
  type        = string
  default     = "1.31"
}

variable "eks_instance_types" {
  description = "Instance types for managed node groups."
  type        = list(string)
  default     = ["m7g.large"]
}

variable "eks_desired_capacity" {
  description = "Desired worker count."
  type        = number
  default     = 3
}

variable "eks_max_capacity" {
  description = "Maximum worker count for autoscaling."
  type        = number
  default     = 8
}

variable "aurora_engine_version" {
  description = "Aurora PostgreSQL version."
  type        = string
  default     = "15.4"
}

variable "aurora_instance_class" {
  description = "Instance class for each Aurora writer/reader."
  type        = string
  default     = "db.serverless"
}

variable "aurora_shard_count" {
  description = "Number of logical shards for modulo hashing."
  type        = number
  default     = 4
}

variable "redis_node_type" {
  description = "ElastiCache node family."
  type        = string
  default     = "cache.r7g.large"
}

variable "redis_engine_version" {
  description = "Redis engine version."
  type        = string
  default     = "7.1"
}

variable "kafka_version" {
  description = "MSK Kafka version."
  type        = string
  default     = "3.7.0"
}

variable "kafka_broker_nodes" {
  description = "Number of MSK broker nodes."
  type        = number
  default     = 3
}

variable "domain_name" {
  description = "Primary domain served by CloudFront (e.g., configurator.example.com)."
  type        = string
}

variable "graphql_origin" {
  description = "Origin domain or S3/ALB domain handling GraphQL traffic."
  type        = string
}

variable "acm_cert_arn" {
  description = "ARN for the ACM certificate used by CloudFront."
  type        = string
}

variable "assets_cache_ttl" {
  description = "Default TTL for immutable assets cached at the edge."
  type        = number
  default     = 86400
}

variable "grafana_otlp_endpoint" {
  description = "Grafana/Tempo OTLP HTTP endpoint."
  type        = string
  default     = "https://tempo.example.com/otlp"
}

variable "prometheus_remote_write_endpoint" {
  description = "Prometheus remote-write endpoint for spanmetrics."
  type        = string
  default     = "https://prometheus.example.com/api/v1/write"
}

variable "secrets_rotation_lambda_arn" {
  description = "ARN of the Lambda function responsible for rotating Secrets Manager secrets. Leave null to disable automatic rotation."
  type        = string
  default     = null
}

variable "secrets_rotation_interval_days" {
  description = "Number of days between automatic secret rotations when a rotation Lambda is configured."
  type        = number
  default     = 30
}
