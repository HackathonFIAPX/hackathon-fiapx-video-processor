export type TCreateVideoFpsUseCaseInput = {
    bucket: string,
    key: string,
    startTime: number,
    duration: number,
    eventIndex: number,
    totalEvents: number,
}

export type TCreateVideoFpsUseCaseOutput = void