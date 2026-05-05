# Use the default VPC that AWS Academy pre-provisions in every account
data "aws_vpc" "default" {
  default = true
}

# Pull all subnet IDs that belong to the default VPC
data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# Resolve individual subnet attributes so we can inspect the AZ of each one
data "aws_subnet" "default_each" {
  for_each = toset(data.aws_subnets.default.ids)
  id       = each.value
}



# Resolve the current account ID — used to construct ARNs
data "aws_caller_identity" "current" {}

# AWS Academy provides a pre-created LabRole; we reference it instead of
# creating IAM roles (student accounts cannot create roles with broad policies)
data "aws_iam_role" "lab_role" {
  name = "LabRole"
}
