export type TCreateVideoFpsUseCaseInput = {
    bucket: string,
    key: string,
    startTime: number,
    duration: number,
    eventIndex: number,
    totalEvents: number,
    clientId: string,
    videoId: string
}

export type TCreateVideoFpsUseCaseOutput = void