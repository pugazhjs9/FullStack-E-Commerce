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


