variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "app_name" {
  description = "Application name — used as a prefix for all resource names"
  type        = string
  default     = "shopsmart"
}

variable "environment" {
  description = "Deployment environment label"
  type        = string
  default     = "production"
}

variable "eks_node_instance_type" {
  description = "EC2 instance type for EKS worker nodes"
  type        = string
  default     = "t3.small"
}

variable "eks_node_desired" {
  description = "Desired number of EKS worker nodes"
  type        = number
  default     = 2
}

variable "eks_node_min" {
  description = "Minimum EKS worker nodes"
  type        = number
  default     = 2
}

variable "eks_node_max" {
  description = "Maximum EKS worker nodes"
  type        = number
  default     = 4
}

variable "eks_version" {
  description = "Kubernetes version for the EKS cluster"
  type        = string
  default     = "1.29"
}
