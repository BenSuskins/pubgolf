package uk.co.suskins.pubgolf.service

import dev.forkhandles.result4k.Failure
import dev.forkhandles.result4k.Result
import dev.forkhandles.result4k.Success
import dev.forkhandles.result4k.flatMap
import dev.forkhandles.result4k.map
import dev.forkhandles.result4k.peek
import org.springframework.context.ApplicationEventPublisher
import org.springframework.stereotype.Service
import uk.co.suskins.pubgolf.events.*
import uk.co.suskins.pubgolf.models.ActiveEvent
import uk.co.suskins.pubgolf.models.ActiveEventState
import uk.co.suskins.pubgolf.models.EventAlreadyActiveFailure
import uk.co.suskins.pubgolf.models.EventNotFoundFailure
import uk.co.suskins.pubgolf.models.Game
import uk.co.suskins.pubgolf.models.GameAlreadyCompletedFailure
import uk.co.suskins.pubgolf.models.GameCode
import uk.co.suskins.pubgolf.models.GameConstants
import uk.co.suskins.pubgolf.models.GameEvent
import uk.co.suskins.pubgolf.models.GameId
import uk.co.suskins.pubgolf.models.GameStatus
import uk.co.suskins.pubgolf.models.Hole
import uk.co.suskins.pubgolf.models.NotHostPlayerFailure
import uk.co.suskins.pubgolf.models.Outcomes
import uk.co.suskins.pubgolf.models.PenaltyType
import uk.co.suskins.pubgolf.models.Player
import uk.co.suskins.pubgolf.models.PlayerAlreadyExistsFailure
import uk.co.suskins.pubgolf.models.PlayerId
import uk.co.suskins.pubgolf.models.PlayerName
import uk.co.suskins.pubgolf.models.PlayerNotFoundFailure
import uk.co.suskins.pubgolf.models.PlayerNotInGameFailure
import uk.co.suskins.pubgolf.models.PubGolfFailure
import uk.co.suskins.pubgolf.models.RandomiseAlreadyUsedFailure
import uk.co.suskins.pubgolf.models.RandomiseResult
import uk.co.suskins.pubgolf.models.Score
import uk.co.suskins.pubgolf.repository.GameRepository
import java.time.Instant

@Service
class GameService(
    private val gameRepository: GameRepository,
    private val eventPublisher: ApplicationEventPublisher,
) {

    fun createGame(name: PlayerName): Result<Game, PubGolfFailure> {
        val host = Player(PlayerId.random(), name)
        val game =
            Game(
                id = GameId.random(),
                code = GameCode.random(),
                players = listOf(host),
                status = GameStatus.ACTIVE,
                hostPlayerId = host.id,
            )

        return gameRepository
            .save(game)
            .peek { savedGame ->
                eventPublisher.publishEvent(GameCreatedEvent(savedGame.code, savedGame.id))
            }
    }

    fun joinGame(
        gameCode: GameCode,
        name: PlayerName,
    ): Result<Game, PubGolfFailure> =
        gameRepository
            .findByCodeIgnoreCase(gameCode)
            .flatMap { isNotCompleted(it, "This game has ended") }
            .flatMap { hasPlayerByName(it, name) }
            .flatMap { game ->
                val player = Player(PlayerId.random(), name)
                val updated = game.copy(players = game.players + player)
                gameRepository
                    .save(updated)
                    .peek { updatedGame ->
                        eventPublisher.publishEvent(PlayerJoinedEvent(updatedGame.code, player.id, player.name))
                        eventPublisher.publishEvent(GameStateChangedEvent(updatedGame.code, updatedGame))
                    }
                    .map { game.copy(players = listOf(player)) }
            }

    fun gameState(gameCode: GameCode): Result<Game, PubGolfFailure> = gameRepository.findByCodeIgnoreCase(gameCode)

    fun submitScore(
        gameCode: GameCode,
        playerId: PlayerId,
        hole: Hole,
        score: Score,
        penaltyType: PenaltyType? = null,
    ): Result<Unit, PubGolfFailure> =
        gameRepository
            .findByCodeIgnoreCase(gameCode)
            .flatMap { isNotCompleted(it, "Cannot submit score to completed game") }
            .flatMap { hasPlayerById(it, playerId) }
            .flatMap { game ->
                val updatedPlayers =
                    game.players.map {
                        if (it.matches(playerId)) {
                            val actualScore = penaltyType?.let { Score(it.points) } ?: score
                            val withScore = it.updateScore(hole, actualScore)
                            if (penaltyType != null) {
                                withScore.updatePenalty(hole, penaltyType)
                            } else {
                                withScore.removePenalty(hole)
                            }
                        } else {
                            it
                        }
                    }
                gameRepository
                    .save(game.copy(players = updatedPlayers))
                    .peek { updatedGame ->
                        eventPublisher.publishEvent(ScoreSubmittedEvent(updatedGame.code, playerId, hole, score))
                        eventPublisher.publishEvent(GameStateChangedEvent(updatedGame.code, updatedGame))
                    }
                    .map { }
            }

    fun randomise(
        gameCode: GameCode,
        playerId: PlayerId,
    ): Result<RandomiseResult, PubGolfFailure> =
        gameRepository
            .findByCodeIgnoreCase(gameCode)
            .flatMap { isNotCompleted(it, "Cannot randomise on completed game") }
            .flatMap { hasPlayerById(it, playerId) }
            .flatMap { hasUsedRandomise(it, playerId) }
            .flatMap { game ->
                generateRandomiseResult(playerId, game)
            }

    fun completeGame(
        gameCode: GameCode,
        playerId: PlayerId,
    ): Result<Game, PubGolfFailure> =
        gameRepository
            .findByCodeIgnoreCase(gameCode)
            .flatMap { isNotCompleted(it, "Game is already completed") }
            .flatMap { isHost(it, playerId) }
            .flatMap { game ->
                val completed = game.copy(status = GameStatus.COMPLETED, activeEvent = null)
                gameRepository
                    .save(completed)
                    .peek { completedGame ->
                        eventPublisher.publishEvent(GameCompletedEvent(completedGame.code))
                        eventPublisher.publishEvent(GameStateChangedEvent(completedGame.code, completedGame))
                    }
            }

    fun getAvailableEvents(): List<GameEvent> = GameEvent.entries.toList()

    fun validatePlayerInGame(
        gameCode: GameCode,
        playerId: PlayerId,
    ): Result<Game, PubGolfFailure> =
        gameRepository
            .findByCodeIgnoreCase(gameCode)
            .flatMap { game ->
                if (game.players.none { it.matches(playerId) }) {
                    Failure(PlayerNotInGameFailure("Player `${playerId.value}` does not belong to game `${gameCode.value}`."))
                } else {
                    Success(game)
                }
            }

    fun getActiveEvent(gameCode: GameCode): Result<ActiveEventState, PubGolfFailure> =
        gameRepository
            .findByCodeIgnoreCase(gameCode)
            .map { ActiveEventState(it.activeEvent) }

    fun activateEvent(
        gameCode: GameCode,
        playerId: PlayerId,
        eventId: String,
    ): Result<Game, PubGolfFailure> =
        gameRepository
            .findByCodeIgnoreCase(gameCode)
            .flatMap { isNotCompleted(it, "Cannot activate event on completed game") }
            .flatMap { isHost(it, playerId) }
            .flatMap { hasNoActiveEvent(it) }
            .flatMap { game ->
                val event =
                    GameEvent.fromId(eventId)
                        ?: return@flatMap Failure(EventNotFoundFailure("Event '$eventId' not found"))
                val activeEvent = ActiveEvent(event, Instant.now())
                val updated = game.copy(activeEvent = activeEvent)
                gameRepository
                    .save(updated)
                    .peek { updatedGame ->
                        eventPublisher.publishEvent(EventActivatedEvent(updatedGame.code, event.id, event.title))
                        eventPublisher.publishEvent(GameStateChangedEvent(updatedGame.code, updatedGame))
                    }
            }

    fun endEvent(
        gameCode: GameCode,
        playerId: PlayerId,
    ): Result<Game, PubGolfFailure> =
        gameRepository
            .findByCodeIgnoreCase(gameCode)
            .flatMap { isHost(it, playerId) }
            .flatMap { game ->
                if (game.activeEvent == null) {
                    Success(game)
                } else {
                    val updated = game.copy(activeEvent = null)
                    gameRepository
                        .save(updated)
                        .peek { updatedGame ->
                            eventPublisher.publishEvent(EventEndedEvent(updatedGame.code))
                            eventPublisher.publishEvent(GameStateChangedEvent(updatedGame.code, updatedGame))
                        }
                }
            }

    private fun hasNoActiveEvent(game: Game): Result<Game, PubGolfFailure> =
        if (game.activeEvent != null) {
            Failure(EventAlreadyActiveFailure("An event is already active. End the current event before activating a new one."))
        } else {
            Success(game)
        }

    private fun hasPlayerById(
        game: Game,
        playerId: PlayerId,
    ): Result<Game, PubGolfFailure> =
        if (game.players.none { it.matches(playerId) }) {
            Failure(PlayerNotFoundFailure("Player `${playerId.value}` not found for game `${game.code.value}`."))
        } else {
            Success(game)
        }

    private fun hasPlayerByName(
        game: Game,
        name: PlayerName,
    ): Result<Game, PubGolfFailure> =
        if (game.players.any { it.name.value.equals(name.value, ignoreCase = true) }) {
            Failure(PlayerAlreadyExistsFailure("Player `${name.value}` already exists for game `${game.code.value}`."))
        } else {
            Success(game)
        }

    private fun isNotCompleted(
        game: Game,
        message: String,
    ): Result<Game, PubGolfFailure> =
        if (game.status == GameStatus.COMPLETED) {
            Failure(GameAlreadyCompletedFailure(message))
        } else {
            Success(game)
        }

    private fun isHost(
        game: Game,
        playerId: PlayerId,
    ): Result<Game, PubGolfFailure> =
        if (game.hostPlayerId != playerId) {
            Failure(NotHostPlayerFailure("Only the host can complete this game"))
        } else {
            Success(game)
        }

    private fun generateRandomiseResult(
        playerId: PlayerId,
        game: Game,
    ): Result<RandomiseResult, PubGolfFailure> {
        return randomiseHole(game, playerId).flatMap { randomiseHole ->
            val outcome = Outcomes.random()

            val updatedPlayers =
                game.players.map {
                    if (it.matches(playerId)) {
                        it.updateRandomise(randomiseHole, outcome)
                    } else {
                        it
                    }
                }
            return gameRepository
                .save(game.copy(players = updatedPlayers))
                .peek { updatedGame ->
                    eventPublisher.publishEvent(RandomiseUsedEvent(updatedGame.code, playerId, randomiseHole, outcome.label))
                    eventPublisher.publishEvent(GameStateChangedEvent(updatedGame.code, updatedGame))
                }
                .flatMap {
                    Success(
                        RandomiseResult(
                            result = outcome.label,
                            hole = randomiseHole,
                            outcomes = Outcomes.entries,
                        ),
                    )
                }
        }
    }

    private fun randomiseHole(
        game: Game,
        playerId: PlayerId,
    ): Result<Hole, PubGolfFailure> {
        val scores = game.players.first { it.id == playerId }.scores

        // Check if all timestamps are the same (no scores actually submitted)
        val timestamps = scores.values.map { it.instant }.toSet()
        if (timestamps.size == 1) {
            return Success(Hole(1))
        }

        val mostRecentHole =
            scores.maxByOrNull { it.value.instant }?.key
                ?: return Failure(RandomiseAlreadyUsedFailure("No scores found for player"))

        return if (mostRecentHole.value == GameConstants.MAX_HOLES) {
            Failure(RandomiseAlreadyUsedFailure("No more holes left"))
        } else {
            Success(Hole(mostRecentHole.value + 1))
        }
    }

    private fun hasUsedRandomise(
        game: Game,
        playerId: PlayerId,
    ): Result<Game, PubGolfFailure> =
        if (game.players.find { it.id == playerId }?.randomise == null) {
            Success(game)
        } else {
            Failure(RandomiseAlreadyUsedFailure("Randomise already used"))
        }
}
