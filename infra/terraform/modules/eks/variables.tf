variable "cluster_name" {
  type        = string
  description = "EKS cluster name."
}

variable "kubernetes_version" {
  type        = string
  description = "EKS control plane version."
}

variable "vpc_id" {
  type        = string
  description = "VPC hosting the cluster."
}

variable "private_subnet_ids" {
  type        = list(string)
  description = "Private subnet IDs for worker nodes."
}

variable "instance_types" {
  type        = list(string)
  description = "Worker node instance types."
}

variable "desired_capacity" {
  type        = number
  description = "Desired number of worker nodes."
}

variable "max_capacity" {
  type        = number
  description = "Maximum autoscale node count."
}

variable "tags" {
  type    = map(string)
  default = {}
}
