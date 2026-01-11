package uk.co.suskins.pubgolf.service

import com.fasterxml.jackson.databind.ObjectMapper
import uk.co.suskins.pubgolf.models.Event
import uk.co.suskins.pubgolf.models.GameCode
import uk.co.suskins.pubgolf.repository.GameRepositoryFake
import uk.co.suskins.pubgolf.websocket.GameWebSocketHandler

class GameBroadcastServiceFake(
    gameRepository: GameRepositoryFake = GameRepositoryFake(),
) : GameBroadcastService(
        webSocketHandler = NoOpWebSocketHandler(),
        gameRepository = gameRepository,
    ) {
    val scheduledBroadcasts = mutableListOf<GameCode>()
    val eventStartBroadcasts = mutableListOf<Pair<GameCode, Event>>()
    val eventEndBroadcasts = mutableListOf<Pair<GameCode, Event>>()
    val gameEndedBroadcasts = mutableListOf<GameCode>()

    override fun scheduleGameStateBroadcast(gameCode: GameCode) {
        scheduledBroadcasts.add(gameCode)
    }

    override fun broadcastEventStart(
        gameCode: GameCode,
        event: Event,
    ) {
        eventStartBroadcasts.add(gameCode to event)
    }

    override fun broadcastEventEnd(
        gameCode: GameCode,
        event: Event,
    ) {
        eventEndBroadcasts.add(gameCode to event)
    }

    override fun broadcastGameEnded(gameCode: GameCode) {
        gameEndedBroadcasts.add(gameCode)
    }
}

private class NoOpWebSocketHandler :
    GameWebSocketHandler(
        objectMapper = ObjectMapper(),
    )
