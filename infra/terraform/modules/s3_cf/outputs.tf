output "distribution_id" {
  value = aws_cloudfront_distribution.this.id
}

output "domain_name" {
  value = aws_cloudfront_distribution.this.domain_name
}

output "apq_cache_policy_id" {
  value = aws_cloudfront_cache_policy.graphql.id
}

output "bucket_name" {
  value = aws_s3_bucket.assets.bucket
}
