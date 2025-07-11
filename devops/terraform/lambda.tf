resource "aws_lambda_function" "video_processor" {
  function_name = "fiapx-video-processor"
  package_type  = "Image"
  image_uri     = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com/hackathon-fiapx-video-processor:${var.tc_image_tag}"
  role          = data.aws_iam_role.lab_role.arn
  timeout       = 500

  environment {
    variables = {
      SQS_VIDEO_PROCESSOR_ID = aws_sqs_queue.fps_queue.id
      S3_FPS_BUCKET_NAME = aws_s3_bucket.video_fps_bucket.bucket
      DYNAMODB_REGION = var.aws_region
      DYNAMODB_TABLE = "fiapx-event-tracker"
    }
  }
}

resource "aws_lambda_permission" "allow_sqs" {
  statement_id  = "AllowSQSToInvokeLambda"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.video_processor.function_name
  principal     = "sqs.amazonaws.com"
  source_arn    = aws_sqs_queue.processor_queue.arn
}

resource "aws_lambda_event_source_mapping" "sqs_to_lambda" {
  event_source_arn  = aws_sqs_queue.processor_queue.arn
  function_name     = aws_lambda_function.video_processor.function_name
  batch_size        = 10
  enabled           = true
}