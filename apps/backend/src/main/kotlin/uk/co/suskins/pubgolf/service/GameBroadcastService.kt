package uk.co.suskins.pubgolf.service

import dev.forkhandles.result4k.map
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import uk.co.suskins.pubgolf.models.Event
import uk.co.suskins.pubgolf.models.EventEndMessage
import uk.co.suskins.pubgolf.models.EventEndPayload
import uk.co.suskins.pubgolf.models.EventPayload
import uk.co.suskins.pubgolf.models.EventStartMessage
import uk.co.suskins.pubgolf.models.Game
import uk.co.suskins.pubgolf.models.GameCode
import uk.co.suskins.pubgolf.models.GameEndedMessage
import uk.co.suskins.pubgolf.models.GameStateMessage
import uk.co.suskins.pubgolf.models.GameStateResponse
import uk.co.suskins.pubgolf.models.PenaltyResponse
import uk.co.suskins.pubgolf.models.PlayerResponse
import uk.co.suskins.pubgolf.models.RandomiseOutcomeResponse
import uk.co.suskins.pubgolf.repository.GameRepository
import uk.co.suskins.pubgolf.websocket.GameWebSocketHandler
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors
import java.util.concurrent.ScheduledFuture
import java.util.concurrent.TimeUnit

@Service
open class GameBroadcastService(
    private val webSocketHandler: GameWebSocketHandler,
    private val gameRepository: GameRepository,
) {
    private val logger = LoggerFactory.getLogger(GameBroadcastService::class.java)
    private val debounceExecutor = Executors.newSingleThreadScheduledExecutor()
    private val pendingBroadcasts = ConcurrentHashMap<GameCode, ScheduledFuture<*>>()

    open fun scheduleGameStateBroadcast(gameCode: GameCode) {
        pendingBroadcasts[gameCode]?.cancel(false)

        val future =
            debounceExecutor.schedule({
                broadcastGameState(gameCode)
            }, DEBOUNCE_DELAY_MS, TimeUnit.MILLISECONDS)

        pendingBroadcasts[gameCode] = future
    }

    open fun broadcastEventStart(
        gameCode: GameCode,
        event: Event,
    ) {
        val message =
            EventStartMessage(
                payload =
                    EventPayload(
                        eventId = event.id.value,
                        name = event.name,
                        description = event.description,
                    ),
            )
        webSocketHandler.broadcast(gameCode, message)
        logger.info("Broadcast EVENT_START for game ${gameCode.value}: ${event.name}")
    }

    open fun broadcastEventEnd(
        gameCode: GameCode,
        event: Event,
    ) {
        val message =
            EventEndMessage(
                payload =
                    EventEndPayload(
                        eventId = event.id.value,
                        name = event.name,
                    ),
            )
        webSocketHandler.broadcast(gameCode, message)
        logger.info("Broadcast EVENT_END for game ${gameCode.value}: ${event.name}")
    }

    open fun broadcastGameEnded(gameCode: GameCode) {
        webSocketHandler.broadcast(gameCode, GameEndedMessage())
        webSocketHandler.closeAllSessions(gameCode)
        logger.info("Broadcast GAME_ENDED for game ${gameCode.value}")
    }

    private fun broadcastGameState(gameCode: GameCode) {
        pendingBroadcasts.remove(gameCode)

        gameRepository.findByCodeIgnoreCase(gameCode).map { game ->
            val response = game.toGameStateResponse()
            val message = GameStateMessage(payload = response)
            webSocketHandler.broadcast(gameCode, message)
            logger.debug("Broadcast GAME_STATE for game ${gameCode.value}")
        }
    }

    companion object {
        private const val DEBOUNCE_DELAY_MS = 75L
    }
}

fun Game.toGameStateResponse(): GameStateResponse =
    GameStateResponse(
        gameId = id,
        gameCode = code,
        status = status,
        hostPlayerId = hostPlayerId,
        players =
            players
                .map { player ->
                    PlayerResponse(
                        id = player.id,
                        name = player.name,
                        scores = player.scores.map { it.value.score },
                        totalScore = player.scores.map { it.value.score.value }.sum(),
                        randomise =
                            player.randomise?.let {
                                RandomiseOutcomeResponse(it.hole, it.result.label)
                            },
                        penalties =
                            player.penalties.map { penalty ->
                                PenaltyResponse(penalty.hole, penalty.type.name, penalty.type.points)
                            },
                    )
                }.sortedBy { it.totalScore },
    )
