import { DynamoDBDocumentClient, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { EventTracker } from "../../../../model/event-tracker";
import { IEventTrackerRepository } from "../../../../repositories/IEventTrackerRepository";
import { envAWS } from "../../../../config/aws";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { envDynamoDB } from "../../../../config/dynamodb";
import { Logger } from "../../../utils/logger";

export class EventTrackerRepository implements IEventTrackerRepository {
    private dynamoBDDocClient: DynamoDBDocumentClient

    constructor() {
        const config = {
            region: envAWS.region
        }

        const dynamoClient = new DynamoDBClient(config);
        const docClient = DynamoDBDocumentClient.from(dynamoClient);
        this.dynamoBDDocClient = docClient;
    }

    async create(eventTracker: EventTracker): Promise<EventTracker> {
        eventTracker.count = 0; // Initialize count to 0
        const command = new PutCommand({
            TableName: envDynamoDB.eventTrackerTableName,
            Item: JSON.parse(JSON.stringify(eventTracker)),
            ConditionExpression: "attribute_not_exists(id) AND attribute_not_exists(videoId)"
        })

        await this.dynamoBDDocClient.send(command);

        return eventTracker;
    }

    async plusEventCount(eventTrackerId: string, videoId: string): Promise<void> {
        Logger.info("EventTrackerRepository", "Incrementing event count", { eventTrackerId });
        const command = new UpdateCommand({
            TableName: envDynamoDB.eventTrackerTableName,
            Key: {
                id: eventTrackerId,
                videoId: videoId
            },
            UpdateExpression: "ADD #count :inc",
            ExpressionAttributeNames: {
                "#count": "count"
            },
            ExpressionAttributeValues: {
                ":inc": 1
            }
        })
        Logger.info("EventTrackerRepository", "Executing UpdateCommand", { command });
        await this.dynamoBDDocClient.send(command);
        return;
    }
}