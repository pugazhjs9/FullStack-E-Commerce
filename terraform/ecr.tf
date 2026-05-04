# ECR repository for the backend API image
resource "aws_ecr_repository" "server" {
  name                 = "${var.app_name}-server"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }
}

# ECR repository for the frontend nginx image
resource "aws_ecr_repository" "client" {
  name                 = "${var.app_name}-client"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }
}

# Keep only the last 10 images to control storage costs
resource "aws_ecr_lifecycle_policy" "server" {
  repository = aws_ecr_repository.server.name
  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Expire images beyond the last 10"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 10
      }
      action = { type = "expire" }
    }]
  })
}

resource "aws_ecr_lifecycle_policy" "client" {
  repository = aws_ecr_repository.client.name
  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Expire images beyond the last 10"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 10
      }
      action = { type = "expire" }
    }]
  })
}
