output "gateway_host" {
  value       = var.ingress_dns
  description = "DNS name routing through Istio ingress (placeholder until external-dns syncs)."
}
