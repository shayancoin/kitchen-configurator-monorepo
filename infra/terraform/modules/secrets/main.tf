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
}

resource "aws_secretsmanager_secret_version" "aurora" {
  secret_id     = aws_secretsmanager_secret.aurora.id
  secret_string = jsonencode({ username = var.aurora_master_username, password = random_password.aurora.result })
}

resource "aws_secretsmanager_secret" "redis" {
  name = "/parviz/${var.env}/redis"
  tags = var.tags
}

resource "aws_secretsmanager_secret_version" "redis" {
  secret_id     = aws_secretsmanager_secret.redis.id
  secret_string = jsonencode({ username = var.redis_username, token = random_password.redis.result })
}

resource "aws_secretsmanager_secret" "kafka" {
  name = "/parviz/${var.env}/kafka"
  tags = var.tags
}

resource "aws_secretsmanager_secret_version" "kafka" {
  secret_id     = aws_secretsmanager_secret.kafka.id
  secret_string = jsonencode({ username = var.kafka_username, password = random_password.kafka.result })
}

resource "aws_secretsmanager_secret" "graphql" {
  name = "/parviz/${var.env}/graphql-shared-secret"
  tags = var.tags
}

resource "aws_secretsmanager_secret_version" "graphql" {
  secret_id     = aws_secretsmanager_secret.graphql.id
  secret_string = jsonencode({ secret = random_password.graphql.result })
}
