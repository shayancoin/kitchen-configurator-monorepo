locals {
  kubernetes_minor_version = regex("^\\d+\\.\\d+", var.kubernetes_version)
  ebs_csi_compatibility = {
    "1.28" = "v1.28.0-eksbuild.1"
    "1.29" = "v1.29.0-eksbuild.1"
    "1.30" = "v1.30.0-eksbuild.1"
    "1.31" = "v1.31.0-eksbuild.1"
  }
}

resource "aws_iam_role" "cluster" {
  name = "${var.cluster_name}-cluster-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "eks.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "cluster" {
  role       = aws_iam_role.cluster.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
}

resource "aws_iam_role_policy_attachment" "vpc_controller" {
  role       = aws_iam_role.cluster.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSVPCResourceController"
}

resource "aws_security_group" "cluster" {
  name        = "${var.cluster_name}-sg"
  description = "Cluster communication with worker nodes"
  vpc_id      = var.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, { Name = "${var.cluster_name}-sg" })
}

resource "aws_eks_cluster" "this" {
  name     = var.cluster_name
  role_arn = aws_iam_role.cluster.arn
  version  = var.kubernetes_version

  vpc_config {
    subnet_ids         = var.private_subnet_ids
    security_group_ids = [aws_security_group.cluster.id]
  }

  enabled_cluster_log_types = ["api", "authenticator", "controllerManager", "scheduler"]

  tags = var.tags
}

resource "aws_iam_role" "node_group" {
  name = "${var.cluster_name}-node-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "node_amazon_eks_worker" {
  role       = aws_iam_role.node_group.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
}

resource "aws_iam_role_policy_attachment" "node_cni" {
  role       = aws_iam_role.node_group.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
}

resource "aws_iam_role_policy_attachment" "node_ecr" {
  role       = aws_iam_role.node_group.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

resource "aws_eks_node_group" "this" {
  cluster_name    = aws_eks_cluster.this.name
  node_group_name = "${var.cluster_name}-default"
  node_role_arn   = aws_iam_role.node_group.arn
  subnet_ids      = var.private_subnet_ids
  instance_types  = var.instance_types

  scaling_config {
    desired_size = var.desired_capacity
    max_size     = var.max_capacity
    min_size     = max(2, floor(var.desired_capacity / 2))
  }

  update_config {
    max_unavailable_percentage = 50
  }

  tags = var.tags
}

resource "aws_eks_addon" "ebs_csi" {
  cluster_name                = aws_eks_cluster.this.name
  addon_name                  = "aws-ebs-csi-driver"
  addon_version               = local.ebs_csi_compatibility[local.kubernetes_minor_version]
  resolve_conflicts_on_create = "OVERWRITE"

  lifecycle {
    precondition {
      condition     = contains(keys(local.ebs_csi_compatibility), local.kubernetes_minor_version)
      error_message = "Unsupported kubernetes_version ${var.kubernetes_version} for aws-ebs-csi-driver addon."
    }
  }
  addon_version               = "v1.28.0-eksbuild.1"
  resolve_conflicts_on_create = "OVERWRITE"
}

resource "aws_iam_openid_connect_provider" "this" {
  client_id_list = ["sts.amazonaws.com"]
  thumbprint_list = [
    "9e99a48a9960b14926bb7f3b02e22da0afd80e38"
  ]
  url = aws_eks_cluster.this.identity[0].oidc[0].issuer
}
