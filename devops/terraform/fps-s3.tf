resource "aws_s3_bucket" "video_fps_bucket" {
  bucket = "fiapx-video-fps-bucket"
  acl    = "private"

  tags = {
    Name        = "fiapx-video-fps-bucket"
    Environment = "Production"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "fps_expiration_rule" {
  bucket = aws_s3_bucket.video_fps_bucket.id

  rule {
    id     = "exclude_videos_after_1_days"
    status = "Enabled"

    filter {
      prefix = "temp_fps/"
    }

    expiration {
      days = 1
    }
  }
}

resource "aws_s3_bucket_cors_configuration" "fps_upload_cors" {
  bucket = aws_s3_bucket.video_fps_bucket.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["PUT", "POST", "GET", "HEAD"]
    allowed_origins = ["*"] # "https://yoursite.com"
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}