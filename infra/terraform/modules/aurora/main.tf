locals {
  shard_plan = [for shard in range(var.shard_count) : {
    name         = "${var.cluster_identifier}-shard-${shard}"
    modulus      = shard
    capacity     = "serverless-v2"
    hash_formula = "murmur3(configuration_id) % ${var.shard_count}"
  }]
}

resource "aws_db_subnet_group" "this" {
  name       = "${var.cluster_identifier}-subnets"
  subnet_ids = var.subnet_ids
  tags       = var.tags
}

resource "aws_rds_cluster" "this" {
  cluster_identifier                  = var.cluster_identifier
  engine                              = "aurora-postgresql"
  engine_version                      = var.engine_version
  master_username                     = var.master_username
  master_password                     = var.master_password
  db_subnet_group_name                = aws_db_subnet_group.this.name
  vpc_security_group_ids              = var.security_group_ids
  iam_database_authentication_enabled = true
  storage_encrypted                   = true
  enable_http_endpoint                = true

  serverlessv2_scaling_configuration {
    max_capacity = 4
    min_capacity = 0.5
  }

  tags = var.tags
}

resource "aws_rds_cluster_instance" "this" {
  count               = 2
  identifier          = "${var.cluster_identifier}-${count.index}"
  cluster_identifier  = aws_rds_cluster.this.id
  instance_class      = var.instance_class
  engine              = aws_rds_cluster.this.engine
  engine_version      = aws_rds_cluster.this.engine_version
  publicly_accessible = false
  tags                = var.tags
}
