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

output "alb_dns_name" {
  description = "Public DNS of the Application Load Balancer — use this URL to access the app"
  value       = "http://${aws_lb.main.dns_name}"
}

output "aws_account_id" {
  description = "AWS account ID"
  value       = data.aws_caller_identity.current.account_id
}
