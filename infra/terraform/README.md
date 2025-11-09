# Terraform Baseline (PR-001)

This stack wires the infrastructure requested in PR-001:

- **Network** – `modules/network` builds a tagged VPC, public+private subnets, NAT, and routing.
- **EKS** – `modules/eks` provisions the cluster, managed node groups, IRSA OIDC provider, and the EBS CSI add-on.
- **Data plane** – `modules/aurora`, `modules/redis`, and `modules/kafka` supply the polyglot persistence tier with deterministic shard metadata.
- **Edge** – `modules/s3_cf` delivers immutable sprites + GraphQL APQ via CloudFront + S3 and enforces the CloudFront → S3 OAC policy.
- **Secrets** – `modules/secrets` stores randomly generated credentials in Secrets Manager for reuse by services + Terraform outputs.
- **Mesh & Observability** – `modules/istio` installs Istio base/istiod/ingress via Helm and `modules/otel` ships a tail-sampling collector wired to Grafana Tempo + Prometheus remote write.

## Usage

```bash
cd infra/terraform
export AWS_PROFILE=parviz
terraform init
terraform apply \
  -var aws_region=us-west-2 \
  -var env=staging \
  -var domain_name=configurator.example.com \
  -var graphql_origin_domain=router.internal.example.local \
  -var acm_certificate_arn=arn:aws:acm:us-east-1:123456789012:certificate/abc...
```

> The Helm-based modules (`istio`, `otel`) automatically reuse the kubeconfig generated from the freshly created EKS cluster, so Istio/OTel install immediately after the control plane stabilises.
