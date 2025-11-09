output "writer_endpoint" {
  value = aws_rds_cluster.this.endpoint
}

output "writer_endpoints" {
  value = [aws_rds_cluster.this.endpoint]
}

output "reader_endpoint" {
  value = aws_rds_cluster.this.reader_endpoint
}

output "shard_strategy" {
  value = local.shard_plan
}
