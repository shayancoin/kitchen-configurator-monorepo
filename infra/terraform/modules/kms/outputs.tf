output "key_arn" {
  description = "ARN of the customer managed CMK."
  value       = aws_kms_key.this.arn
}

output "key_id" {
  description = "Key ID of the customer managed CMK."
  value       = aws_kms_key.this.key_id
}
