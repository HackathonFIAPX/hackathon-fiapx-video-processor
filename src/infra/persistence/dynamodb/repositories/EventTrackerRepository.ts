import { DynamoDBDocumentClient, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { EventTracker } from "../../../../model/event-tracker";
import { IEventTrackerRepository } from "../../../../repositories/IEventTrackerRepository";
import { envAWS } from "../../../../config/aws";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { envDynamoDB } from "../../../../config/dynamodb";

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
        })

        await this.dynamoBDDocClient.send(command);

        return eventTracker;
    }

    async plusEventCount(eventTrackerId: string): Promise<void> {
        const command = new UpdateCommand({
            TableName: envDynamoDB.eventTrackerTableName,
            Key: { id: eventTrackerId },
            UpdateExpression: "ADD #count :inc",
            ExpressionAttributeNames: { "#count": "count" },
            ExpressionAttributeValues: { ":inc": 1 },
        })

        await this.dynamoBDDocClient.send(command);
        return;
    }
}