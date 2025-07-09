resource "aws_lambda_function" "video_fps" {
  function_name = "fiapx-video-fps"
  package_type  = "Image"
  image_uri     = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com/hackathon-fiapx-video-processor:${var.tc_image_tag}"
  role          = data.aws_iam_role.lab_role.arn
  timeout       = 500

  memory_size   = 256

  environment {
    variables = {
      SQS_VIDEO_PROCESSOR_ID = aws_sqs_queue.fps_queue.id
      S3_FPS_BUCKET_NAME = aws_s3_bucket.video_fps_bucket.bucket
    }
  }

  publish = true
}

resource "aws_lambda_permission" "allow_fps_sqs" {
  statement_id  = "AllowSQSToInvokeLambda"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.video_fps.function_name
  principal     = "sqs.amazonaws.com"
  source_arn    = aws_sqs_queue.fps_queue.arn
}

resource "aws_lambda_event_source_mapping" "sqs_to_fps_lambda" {
  event_source_arn  = aws_sqs_queue.fps_queue.arn
  function_name     = "${aws_lambda_function.video_fps.function_name}:${aws_lambda_alias.video_fps_alias.name}"
  batch_size        = 5
  enabled           = true
}

resource "aws_lambda_alias" "video_fps_alias" {
  name             = "live"
  description      = "Alias com concorrência provisionada"
  function_name    = aws_lambda_function.video_fps.function_name
  function_version = aws_lambda_function.video_fps.version

  depends_on = [aws_lambda_function.video_fps]
}

resource "aws_lambda_provisioned_concurrency_config" "video_fps_pc" {
  function_name                      = aws_lambda_function.video_fps.function_name
  qualifier                          = aws_lambda_alias.video_fps_alias.name
  provisioned_concurrent_executions  = 5

  depends_on = [aws_lambda_alias.video_fps_alias]
}
