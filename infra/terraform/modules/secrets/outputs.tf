output "aurora_master_username" {
  value = var.aurora_master_username
}

output "aurora_master_password" {
  value     = random_password.aurora.result
  sensitive = true
}

output "redis_auth_token" {
  value     = random_password.redis.result
  sensitive = true
}

output "kafka_username" {
  value = var.kafka_username
}

output "kafka_password" {
  value     = random_password.kafka.result
  sensitive = true
}

output "graphql_shared_secret" {
  value     = random_password.graphql.result
  sensitive = true
}
