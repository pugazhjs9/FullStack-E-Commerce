# EKS control plane — uses LabRole so no custom IAM role is required
resource "aws_eks_cluster" "main" {
  name     = "${var.app_name}-eks"
  role_arn = data.aws_iam_role.lab_role.arn
  version  = var.eks_version

  vpc_config {
    subnet_ids             = local.eks_subnet_ids
    security_group_ids     = [aws_security_group.eks_cluster.id]
    endpoint_public_access = true
  }

  # Emit control-plane logs to CloudWatch
  enabled_cluster_log_types = ["api", "audit", "authenticator"]

  depends_on = [aws_cloudwatch_log_group.ecs]
}

# Managed node group — LabRole is reused as the node IAM role
resource "aws_eks_node_group" "main" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "${var.app_name}-nodes"
  node_role_arn   = data.aws_iam_role.lab_role.arn
  subnet_ids      = local.eks_subnet_ids
  instance_types  = [var.eks_node_instance_type]

  scaling_config {
    desired_size = var.eks_node_desired
    min_size     = var.eks_node_min
    max_size     = var.eks_node_max
  }

  update_config {
    max_unavailable = 1
  }

  labels = {
    role = "worker"
  }
}
