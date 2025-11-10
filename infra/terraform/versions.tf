terraform {
  required_version = ">= 1.8.0"

  backend "s3" {
    bucket         = "parviz-terraform-state"
    key            = "infra/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "parviz-terraform-locks"
    encrypt        = true
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.58"
    }

    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }

    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.25"
    }

    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.12"
    }
  }
}
