locals {
  base_tags = merge(
    {
      "env"     = var.env
      "system"  = "kitchen-configurator"
      "managed" = "terraform"
      "repo"    = "kitchen-configurator-monorepo"
      "owner"   = "platform"
    },
    var.tags
  )
}

module "network" {
  source               = "./modules/network"
  vpc_cidr             = var.vpc_cidr
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  tags                 = local.base_tags
}

module "secrets" {
  source = "./modules/secrets"
  env    = var.env
  tags   = local.base_tags
}

module "eks" {
  source             = "./modules/eks"
  cluster_name       = var.cluster_name
  kubernetes_version = var.kubernetes_version
  vpc_id             = module.network.vpc_id
  private_subnet_ids = module.network.private_subnet_ids
  instance_types     = var.eks_instance_types
  desired_capacity   = var.eks_desired_capacity
  max_capacity       = var.eks_max_capacity
  tags               = local.base_tags
}

module "aurora" {
  source             = "./modules/aurora"
  cluster_identifier = "${var.env}-aurora-pg"
  subnet_ids         = module.network.private_subnet_ids
  security_group_ids = [module.eks.cluster_security_group_id]
  master_username    = module.secrets.aurora_master_username
  master_password    = module.secrets.aurora_master_password
  engine_version     = var.aurora_engine_version
  instance_class     = var.aurora_instance_class
  shard_count        = var.aurora_shard_count
  tags               = local.base_tags
}

module "redis" {
  source                  = "./modules/redis"
  vpc_id                  = module.network.vpc_id
  subnet_ids              = module.network.private_subnet_ids
  auth_token              = module.secrets.redis_auth_token
  node_type               = var.redis_node_type
  engine_version          = var.redis_engine_version
  allowed_security_groups = [module.eks.cluster_security_group_id]
  tags                    = local.base_tags
}

module "kafka" {
  source             = "./modules/kafka"
  cluster_name       = "${var.env}-pricing-events"
  kafka_version      = var.kafka_version
  subnet_ids         = module.network.private_subnet_ids
  security_group_ids = [module.eks.cluster_security_group_id]
  broker_nodes       = var.kafka_broker_nodes
  client_username    = module.secrets.kafka_username
  client_password    = module.secrets.kafka_password
  tags               = local.base_tags
}

module "s3_cf" {
  count             = var.enable_cloudfront ? 1 : 0
  source            = "./modules/s3_cf"
  bucket_name       = "${var.env}-parviz-assets"
  domain_name       = var.domain_name
  acm_cert_arn      = var.acm_cert_arn
  graphql_origin    = var.graphql_origin
  cache_ttl_seconds = var.assets_cache_ttl
  graphql_edge_path = "/graphql"
  tags              = local.base_tags
}

# hydrate Kubernetes + Helm providers with cluster outputs
data "aws_eks_cluster" "this" {
  name = module.eks.cluster_name
}

data "aws_eks_cluster_auth" "this" {
  name = module.eks.cluster_name
}

provider "kubernetes" {
  alias                  = "eks"
  host                   = data.aws_eks_cluster.this.endpoint
  cluster_ca_certificate = base64decode(data.aws_eks_cluster.this.certificate_authority[0].data)
  token                  = data.aws_eks_cluster_auth.this.token
}

provider "helm" {
  alias = "eks"

  kubernetes {
    host                   = data.aws_eks_cluster.this.endpoint
    cluster_ca_certificate = base64decode(data.aws_eks_cluster.this.certificate_authority[0].data)
    token                  = data.aws_eks_cluster_auth.this.token
  }
}

module "istio" {
  source = "./modules/istio"
  providers = {
    helm = helm.eks
  }

  namespace   = "istio-system"
  mesh_id     = "${var.env}-mesh"
  ingress_dns = var.domain_name
  tags        = local.base_tags
}

module "otel" {
  source = "./modules/otel"
  providers = {
    helm = helm.eks
  }

  namespace               = "observability"
  grafana_endpoint        = var.grafana_otlp_endpoint
  prometheus_remote_write = var.prometheus_remote_write_endpoint
  env                     = var.env
  selectors               = [{ key = "service", value = "graphql" }, { key = "service", value = "pricing" }]
  tags                    = local.base_tags
}
