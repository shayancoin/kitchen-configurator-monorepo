resource "aws_elasticache_subnet_group" "this" {
  name       = "redis-${var.tags["env"]}"
  subnet_ids = var.subnet_ids
  tags       = var.tags
}

resource "aws_security_group" "redis" {
  name        = "redis-${var.tags["env"]}"
  description = "Redis access"
  vpc_id      = var.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = var.tags
}

resource "aws_security_group_rule" "ingress_from_workers" {
  for_each                 = toset(var.allowed_security_groups)
  security_group_id        = aws_security_group.redis.id
  type                     = "ingress"
  from_port                = 6379
  to_port                  = 6379
  protocol                 = "tcp"
  source_security_group_id = each.value
}

resource "aws_elasticache_replication_group" "this" {
  replication_group_id        = "redis-${var.tags["env"]}"
  description                 = "Redis cache for pricing/configuration"
  node_type                   = var.node_type
  engine                      = "redis"
  engine_version              = var.engine_version
  automatic_failover_enabled  = true
  multi_az_enabled            = true
  preferred_cache_cluster_azs = []
  num_node_groups             = 1
  replicas_per_node_group     = 1
  apply_immediately           = true
  auth_token                  = var.auth_token
  transit_encryption_enabled  = true
  at_rest_encryption_enabled  = true
  kms_key_id                  = var.kms_key_arn
  auto_minor_version_upgrade  = true
  security_group_ids          = [aws_security_group.redis.id]
  subnet_group_name           = aws_elasticache_subnet_group.this.name

  tags = var.tags
}
