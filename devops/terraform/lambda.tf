resource "aws_lambda_function" "video_processor" {
  function_name = "fiapx-video-processor"
  package_type  = "Image"
  image_uri     = "docker.io/${var.docker_hub_user}/hackathon-fiapx-video-processor:${var.tc_image_tag}"
  role          = data.aws_iam_role.lab_role.arn
  timeout       = 500
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
  batch_size        = 5
  enabled           = true
}