resource "aws_dynamodb_table" "event_tracker" {
  name         = "fps-event-tracker"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"
  range_key    = "videoId"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "videoId"
    type = "S"
  }

  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"
}
