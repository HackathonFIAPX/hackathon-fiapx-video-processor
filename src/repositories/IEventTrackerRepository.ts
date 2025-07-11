import { EventTracker } from "../model/event-tracker";

export interface IEventTrackerRepository {
    create(eventTracker: EventTracker): Promise<EventTracker>;
    plusEventCount(eventTrackerId: string, videoId: string): Promise<void>;
}