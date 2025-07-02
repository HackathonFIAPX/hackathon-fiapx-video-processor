resource "aws_sqs_queue" "processor_queue" {
  name = "video-processor-queue"
}

resource "aws_sqs_queue_policy" "sqs_queue_allow_sns" {
  queue_url = aws_sqs_queue.processor_queue.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect    = "Allow",
        Principal = {
          Service = "sns.amazonaws.com"
        },
        Action    = "sqs:SendMessage",
        Resource  = aws_sqs_queue.processor_queue.arn,
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = data.terraform_remote_state.admin-service.outputs.upload_video_sns_topic_arn
          }
        }
      }
    ]
  })
}