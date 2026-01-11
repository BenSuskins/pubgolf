package uk.co.suskins.pubgolf.models

sealed interface WebSocketMessage {
    val type: String
}

data class GameStateMessage(
    override val type: String = "GAME_STATE",
    val payload: GameStateResponse,
) : WebSocketMessage

data class EventStartMessage(
    override val type: String = "EVENT_START",
    val payload: EventPayload,
) : WebSocketMessage

data class EventEndMessage(
    override val type: String = "EVENT_END",
    val payload: EventEndPayload,
) : WebSocketMessage

data class GameEndedMessage(
    override val type: String = "GAME_ENDED",
    val payload: Unit = Unit,
) : WebSocketMessage

data class EventPayload(
    val eventId: String,
    val name: String,
    val description: String,
)

data class EventEndPayload(
    val eventId: String,
    val name: String,
)
