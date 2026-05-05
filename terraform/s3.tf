# Bucket name is deterministic per AWS account — same name every run, no duplicates
resource "aws_s3_bucket" "app_data" {
  bucket        = "${var.app_name}-app-data-${data.aws_caller_identity.current.account_id}"
  force_destroy = true
}

# Enable versioning so every object mutation is tracked
resource "aws_s3_bucket_versioning" "app_data" {
  bucket = aws_s3_bucket.app_data.id
  versioning_configuration {
    status = "Enabled"
  }
}

# AES-256 server-side encryption at rest
resource "aws_s3_bucket_server_side_encryption_configuration" "app_data" {
  bucket = aws_s3_bucket.app_data.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# Deny every form of public access regardless of object ACLs or bucket policy
resource "aws_s3_bucket_public_access_block" "app_data" {
  bucket                  = aws_s3_bucket.app_data.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
