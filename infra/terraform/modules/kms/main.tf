data "aws_caller_identity" "current" {}

locals {
  root_principal      = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
  additional_admins   = { for idx, arn in var.additional_admin_arns : idx => arn }
  service_principals  = { for idx, principal in var.service_principals : idx => principal }
  key_usage_actions   = ["kms:Encrypt", "kms:Decrypt", "kms:ReEncrypt*", "kms:GenerateDataKey*", "kms:DescribeKey"]
  admin_actions       = ["kms:*"]
}

data "aws_iam_policy_document" "key" {
  statement {
    sid       = "EnableRootAccount"
    actions   = local.admin_actions
    resources = ["*"]

    principals {
      type        = "AWS"
      identifiers = [local.root_principal]
    }
  }

  dynamic "statement" {
    for_each = local.additional_admins
    content {
      sid       = "AllowAdmin${statement.key}"
      actions   = local.admin_actions
      resources = ["*"]

      principals {
        type        = "AWS"
        identifiers = [statement.value]
      }
    }
  }

  statement {
    sid       = "AllowAccountUseOfKey"
    actions   = local.key_usage_actions
    resources = ["*"]

    principals {
      type        = "AWS"
      identifiers = [local.root_principal]
    }
  }

  dynamic "statement" {
    for_each = local.service_principals
    content {
      sid       = "AllowService${statement.key}"
      actions   = local.key_usage_actions
      resources = ["*"]

      principals {
        type        = "Service"
        identifiers = [statement.value]
      }
    }
  }
}

resource "aws_kms_key" "this" {
  description             = var.description
  deletion_window_in_days = var.deletion_window_in_days
  enable_key_rotation     = var.enable_key_rotation
  policy                  = data.aws_iam_policy_document.key.json
  tags                    = var.tags
}

resource "aws_kms_alias" "this" {
  name          = "alias/${var.alias}"
  target_key_id = aws_kms_key.this.key_id
}
