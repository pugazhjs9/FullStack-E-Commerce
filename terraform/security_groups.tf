# Security group shared by all ECS Fargate tasks
resource "aws_security_group" "ecs_tasks" {
  name        = "${var.app_name}-ecs-tasks-sg-v2"
  description = "Inbound traffic to ECS Fargate tasks"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "Backend API"
    from_port   = 5001
    to_port     = 5001
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Frontend nginx (non-root port)"
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}


