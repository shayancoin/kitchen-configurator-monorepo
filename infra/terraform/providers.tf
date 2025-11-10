provider "aws" {
  region                      = var.region
  skip_credentials_validation = false
}

data "aws_caller_identity" "current" {}
