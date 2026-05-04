# Use the default VPC that AWS Academy pre-provisions in every account
data "aws_vpc" "default" {
  default = true
}

# Pull all subnets that belong to the default VPC (spans multiple AZs)
data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# Only standard AZs — excludes opt-in zones (e.g. us-east-1e) that
# do not support EKS control plane instance placement
data "aws_availability_zones" "eks_supported" {
  state = "available"
  filter {
    name   = "opt-in-status"
    values = ["opt-in-not-required"]
  }
}

# Subnets restricted to EKS-supported AZs only
data "aws_subnets" "eks_safe" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
  filter {
    name   = "availabilityZone"
    values = data.aws_availability_zones.eks_supported.names
  }
}

# Resolve the current account ID — used to construct ARNs
data "aws_caller_identity" "current" {}

# AWS Academy provides a pre-created LabRole; we reference it instead of
# creating IAM roles (student accounts cannot create roles with broad policies)
data "aws_iam_role" "lab_role" {
  name = "LabRole"
}
