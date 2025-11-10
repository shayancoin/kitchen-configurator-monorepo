variable "vpc_cidr" {
  description = "CIDR block for the VPC."
  type        = string

  validation {
    condition     = can(cidrnetmask(var.vpc_cidr))
    error_message = "vpc_cidr must be a valid IPv4 CIDR block."
  }
}

variable "public_subnet_cidrs" {
  description = "CIDRs for public subnets."
  type        = list(string)

  validation {
    condition = length(var.public_subnet_cidrs) > 0
      && length(distinct(var.public_subnet_cidrs)) == length(var.public_subnet_cidrs)
      && alltrue([for cidr in var.public_subnet_cidrs : can(cidrnetmask(cidr))])
    error_message = "public_subnet_cidrs must be a non-empty list of unique, valid CIDR blocks. Ensure each subnet resides within vpc_cidr and does not overlap other subnets."
  }
}

variable "private_subnet_cidrs" {
  description = "CIDRs for private subnets."
  type        = list(string)

  validation {
    condition = length(var.private_subnet_cidrs) > 0
      && length(distinct(var.private_subnet_cidrs)) == length(var.private_subnet_cidrs)
      && alltrue([for cidr in var.private_subnet_cidrs : can(cidrnetmask(cidr))])
    error_message = "private_subnet_cidrs must be a non-empty list of unique, valid CIDR blocks. Ensure each subnet resides within vpc_cidr and does not overlap other subnets."
  }
}

variable "tags" {
  description = "Resource tags."
  type        = map(string)
  default     = {}
}
