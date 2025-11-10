output "vpc_id" {
  value       = module.network.vpc_id
  description = "VPC hosting all workloads."
}

output "private_subnet_ids" {
  value       = module.network.private_subnet_ids
  description = "Private subnets used by application services."
}

output "eks_cluster_name" {
  value       = module.eks.cluster_name
  description = "Name of the EKS cluster hosting MFEs + services."
}

output "eks_oidc_provider_arn" {
  value       = module.eks.oidc_provider_arn
  description = "OIDC provider ARN for IRSA."
}

output "aurora_endpoint" {
  value       = module.aurora.writer_endpoint
  description = "Primary writer endpoint for Aurora PostgreSQL."
}

output "aurora_shard_strategy" {
  value       = module.aurora.shard_strategy
  description = "Hash-modulo metadata powering O(1) lookup shards."
}

output "redis_endpoint" {
  value       = module.redis.primary_endpoint
  description = "Redis Cluster primary endpoint (in-transit TLS enabled)."
}

output "kafka_bootstrap_brokers" {
  value       = module.kafka.bootstrap_brokers
  description = "Bootstrap brokers for the pricing/rules event bus."
}

output "cloudfront_distribution_id" {
  value       = try(module.s3_cf[0].distribution_id, null)
  description = "CloudFront distribution ID for the configurator edge."
}

output "cloudfront_domain" {
  value       = try(module.s3_cf[0].domain_name, null)
  description = "CloudFront distribution domain serving the configurator."
}

output "cloudfront_apq_cache_policy_id" {
  value       = try(module.s3_cf[0].apq_cache_policy_id, null)
  description = "Cache policy identifier used for persisted GraphQL queries."
}

output "assets_bucket_name" {
  value       = try(module.s3_cf[0].bucket_name, null)
  description = "Origin bucket for immutable sprites + persisted queries."
}

output "istio_ingress_gateway" {
  value       = module.istio.gateway_host
  description = "DNS label for the mesh ingress gateway."
}

output "otel_release_name" {
  value       = module.otel.release_name
  description = "Helm release name for the OTEL collector."
}
