output "dynamo_stream_arn" {
  value = aws_dynamodb_table.event_tracker.stream_arn
}