export interface IABEngineScore {
    name: string
    pass: boolean
    score: number
    message: string
    mouseover_message?: string
}

export interface IABEngineScorer {
    init: () => Promise<void>
    score: (headline: string) => IABEngineScore
}