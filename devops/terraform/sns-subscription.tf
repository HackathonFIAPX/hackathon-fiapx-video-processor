resource "aws_sns_topic_subscription" "sqs_to_sns_subscription" {
  topic_arn = data.terraform_remote_state.admin-service.outputs.upload_video_sns_topic_arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.processor_queue.arn
}