output "s3_bucket_name" {
  description = "Application data S3 bucket name"
  value       = aws_s3_bucket.app_data.bucket
}

output "ecr_server_repository_url" {
  description = "ECR URL for the backend server image"
  value       = aws_ecr_repository.server.repository_url
}

output "ecr_client_repository_url" {
  description = "ECR URL for the frontend client image"
  value       = aws_ecr_repository.client.repository_url
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "ecs_server_service_name" {
  description = "ECS server service name"
  value       = aws_ecs_service.server.name
}

output "ecs_client_service_name" {
  description = "ECS client service name"
  value       = aws_ecs_service.client.name
}

output "eks_cluster_name" {
  description = "EKS cluster name"
  value       = aws_eks_cluster.main.name
}

output "eks_cluster_endpoint" {
  description = "EKS API server endpoint"
  value       = aws_eks_cluster.main.endpoint
}

output "aws_account_id" {
  description = "AWS account ID"
  value       = data.aws_caller_identity.current.account_id
}
