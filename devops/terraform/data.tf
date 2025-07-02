data "terraform_remote_state" "admin-service" {
  backend = "s3"
  config = {
    bucket = var.aws_bucket_name
    key    = "admin-service/terraform.tfstate"
    region = var.aws_region
  }
}

data "aws_iam_role" "lab_role" {
  name = "LabRole"
}

data "aws_caller_identity" "current" {}