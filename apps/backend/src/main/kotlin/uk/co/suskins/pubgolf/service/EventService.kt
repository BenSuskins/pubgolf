package uk.co.suskins.pubgolf.service

import dev.forkhandles.result4k.Failure
import dev.forkhandles.result4k.Result
import dev.forkhandles.result4k.Success
import dev.forkhandles.result4k.flatMap
import dev.forkhandles.result4k.peek
import org.springframework.stereotype.Service
import uk.co.suskins.pubgolf.models.Event
import uk.co.suskins.pubgolf.models.EventAlreadyActiveFailure
import uk.co.suskins.pubgolf.models.EventId
import uk.co.suskins.pubgolf.models.EventNotFoundFailure
import uk.co.suskins.pubgolf.models.Game
import uk.co.suskins.pubgolf.models.GameAlreadyCompletedFailure
import uk.co.suskins.pubgolf.models.GameCode
import uk.co.suskins.pubgolf.models.GameStatus
import uk.co.suskins.pubgolf.models.NoActiveEventFailure
import uk.co.suskins.pubgolf.models.NotHostPlayerFailure
import uk.co.suskins.pubgolf.models.PlayerId
import uk.co.suskins.pubgolf.models.PresetEvents
import uk.co.suskins.pubgolf.models.PubGolfFailure
import uk.co.suskins.pubgolf.repository.GameRepository

@Service
class EventService(
    private val gameRepository: GameRepository,
    private val activeEventStore: ActiveEventStore,
    private val gameBroadcastService: GameBroadcastService,
) {
    fun getAvailableEvents(): List<Event> = PresetEvents.all

    fun getActiveEvent(gameCode: GameCode): Event? = activeEventStore.getActiveEvent(gameCode)

    fun startEvent(
        gameCode: GameCode,
        playerId: PlayerId,
        eventId: EventId,
    ): Result<Event, PubGolfFailure> =
        gameRepository
            .findByCodeIgnoreCase(gameCode)
            .flatMap { isNotCompleted(it) }
            .flatMap { isHost(it, playerId) }
            .flatMap { noActiveEvent(gameCode) }
            .flatMap { findEvent(eventId) }
            .peek { event ->
                activeEventStore.setActiveEvent(gameCode, event)
                gameBroadcastService.broadcastEventStart(gameCode, event)
            }

    fun endCurrentEvent(
        gameCode: GameCode,
        playerId: PlayerId,
    ): Result<Event, PubGolfFailure> =
        gameRepository
            .findByCodeIgnoreCase(gameCode)
            .flatMap { isHost(it, playerId) }
            .flatMap { hasActiveEvent(gameCode) }
            .flatMap {
                val event = activeEventStore.clearActiveEvent(gameCode)!!
                gameBroadcastService.broadcastEventEnd(gameCode, event)
                Success(event)
            }

    private fun isNotCompleted(game: Game): Result<Game, PubGolfFailure> =
        if (game.status == GameStatus.COMPLETED) {
            Failure(GameAlreadyCompletedFailure("Cannot start event on completed game"))
        } else {
            Success(game)
        }

    private fun isHost(
        game: Game,
        playerId: PlayerId,
    ): Result<Game, PubGolfFailure> =
        if (game.hostPlayerId != playerId) {
            Failure(NotHostPlayerFailure("Only the host can manage events"))
        } else {
            Success(game)
        }

    private fun noActiveEvent(gameCode: GameCode): Result<Unit, PubGolfFailure> =
        if (activeEventStore.hasActiveEvent(gameCode)) {
            Failure(EventAlreadyActiveFailure("An event is already active"))
        } else {
            Success(Unit)
        }

    private fun hasActiveEvent(gameCode: GameCode): Result<Unit, PubGolfFailure> =
        if (!activeEventStore.hasActiveEvent(gameCode)) {
            Failure(NoActiveEventFailure("No active event to end"))
        } else {
            Success(Unit)
        }

    private fun findEvent(eventId: EventId): Result<Event, PubGolfFailure> =
        PresetEvents.findById(eventId)?.let { Success(it) }
            ?: Failure(EventNotFoundFailure("Event not found: ${eventId.value}"))
}
