output "bootstrap_brokers" {
  value = aws_msk_cluster.this.bootstrap_brokers_sasl_scram
}

output "scram_secret_arn" {
  value = aws_secretsmanager_secret.scram.arn
}
