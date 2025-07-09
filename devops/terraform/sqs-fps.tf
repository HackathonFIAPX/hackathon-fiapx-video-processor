resource "aws_sqs_queue" "fps_queue" {
  name = "video-fps-queue"
  visibility_timeout_seconds = 510

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.video_fps_dlq.arn
    maxReceiveCount     = 5
  })
}

resource "aws_sqs_queue" "video_fps_dlq" {
  name = "video-fps-dlq"
}