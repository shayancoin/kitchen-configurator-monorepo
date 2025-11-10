resource "random_password" "aurora" {
  length  = 24
  special = true
}

resource "random_password" "redis" {
  length  = 32
  special = false
}

resource "random_password" "kafka" {
  length  = 28
  special = true
}

resource "random_password" "graphql" {
  length  = 48
  special = false
}

resource "aws_secretsmanager_secret" "aurora" {
  name = "/parviz/${var.env}/aurora"
  tags = var.tags
  kms_key_id = var.kms_key_arn
}

resource "aws_secretsmanager_secret_version" "aurora" {
  secret_id     = aws_secretsmanager_secret.aurora.id
  secret_string = jsonencode({ username = var.aurora_master_username, password = random_password.aurora.result })
}

resource "aws_secretsmanager_secret" "redis" {
  name = "/parviz/${var.env}/redis"
  tags = var.tags
  kms_key_id = var.kms_key_arn
}

resource "aws_secretsmanager_secret_version" "redis" {
  secret_id     = aws_secretsmanager_secret.redis.id
  secret_string = jsonencode({ username = var.redis_username, token = random_password.redis.result })
}

resource "aws_secretsmanager_secret" "kafka" {
  name = "/parviz/${var.env}/kafka"
  tags = var.tags
  kms_key_id = var.kms_key_arn
}

resource "aws_secretsmanager_secret_version" "kafka" {
  secret_id     = aws_secretsmanager_secret.kafka.id
  secret_string = jsonencode({ username = var.kafka_username, password = random_password.kafka.result })
}

resource "aws_secretsmanager_secret" "graphql" {
  name = "/parviz/${var.env}/graphql-shared-secret"
  tags = var.tags
  kms_key_id = var.kms_key_arn
}

resource "aws_secretsmanager_secret_version" "graphql" {
  secret_id     = aws_secretsmanager_secret.graphql.id
  secret_string = jsonencode({ secret = random_password.graphql.result })
}

locals {
  managed_secrets = {
    aurora = aws_secretsmanager_secret.aurora.id
    redis  = aws_secretsmanager_secret.redis.id
    kafka  = aws_secretsmanager_secret.kafka.id
    graphql = aws_secretsmanager_secret.graphql.id
  }
}

resource "aws_secretsmanager_secret_rotation" "managed" {
  for_each            = var.rotation_lambda_arn == null ? {} : local.managed_secrets
  secret_id           = each.value
  rotation_lambda_arn = var.rotation_lambda_arn

  rotation_rules {
    automatically_after_days = var.rotation_interval_days
  }
}
