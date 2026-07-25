package uk.co.suskins.pubgolf.service

import dev.forkhandles.result4k.Failure
import dev.forkhandles.result4k.Result
import dev.forkhandles.result4k.Success
import dev.forkhandles.result4k.failureOrNull
import dev.forkhandles.result4k.flatMap
import dev.forkhandles.result4k.map
import dev.forkhandles.result4k.peek
import org.springframework.context.ApplicationEventPublisher
import org.springframework.stereotype.Service
import uk.co.suskins.pubgolf.events.CourseUpdatedEvent
import uk.co.suskins.pubgolf.events.EventActivatedEvent
import uk.co.suskins.pubgolf.events.EventEndedEvent
import uk.co.suskins.pubgolf.events.GameCompletedEvent
import uk.co.suskins.pubgolf.events.GameCreatedEvent
import uk.co.suskins.pubgolf.events.GameStateChangedEvent
import uk.co.suskins.pubgolf.events.PlayerJoinedEvent
import uk.co.suskins.pubgolf.events.RandomiseUsedEvent
import uk.co.suskins.pubgolf.events.ScoreSubmittedEvent
import uk.co.suskins.pubgolf.models.ActiveEvent
import uk.co.suskins.pubgolf.models.ActiveEventState
import uk.co.suskins.pubgolf.models.ConcurrentModificationFailure
import uk.co.suskins.pubgolf.models.CourseHole
import uk.co.suskins.pubgolf.models.DuplicateGameCodeFailure
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
import uk.co.suskins.pubgolf.models.InvalidCourseFailure
import uk.co.suskins.pubgolf.models.JoinResult
import uk.co.suskins.pubgolf.models.NoHolesLeftFailure
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

private const val CREATE_GAME_ATTEMPTS = 5
private const val CONCURRENT_MODIFICATION_ATTEMPTS = 3
private const val MIN_PAR = 1
private const val MAX_PAR = 10
private const val MAX_ROUTES = 4
private const val MAX_ROUTE_NAME_LENGTH = 40
private const val MAX_DRINK_LENGTH = 100

@Service
class GameService(
    private val gameRepository: GameRepository,
    private val eventPublisher: ApplicationEventPublisher,
) {
    fun createGame(name: PlayerName): Result<Game, PubGolfFailure> {
        // The code space is small enough that collisions happen; regenerate instead of failing.
        var result = createGameAttempt(name)
        repeat(CREATE_GAME_ATTEMPTS - 1) {
            if (result.failureOrNull() !is DuplicateGameCodeFailure) return result
            result = createGameAttempt(name)
        }
        return result
    }

    private fun createGameAttempt(name: PlayerName): Result<Game, PubGolfFailure> {
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
        rejoin: Boolean = false,
    ): Result<JoinResult, PubGolfFailure> =
        retryOnConcurrentModification {
            gameRepository
                .findByCodeIgnoreCase(gameCode)
                .flatMap { isNotCompleted(it, "This game has ended") }
                .flatMap { game ->
                    val existing = game.players.find { it.name.value.equals(name.value, ignoreCase = true) }
                    when {
                        // No auth exists, so rejoining is claim-by-name. Acceptable for a
                        // casual game; the alternative is being locked out forever after
                        // losing local storage.
                        existing != null && rejoin -> Success(JoinResult(game.id, game.code, existing))
                        existing != null ->
                            Failure(PlayerAlreadyExistsFailure("Player `${name.value}` already exists for game `${game.code.value}`."))
                        else -> addPlayer(game, name)
                    }
                }
        }

    private fun addPlayer(
        game: Game,
        name: PlayerName,
    ): Result<JoinResult, PubGolfFailure> {
        val player = Player(PlayerId.random(), name)
        val updated = game.copy(players = game.players + player)
        return gameRepository
            .save(updated)
            .peek { updatedGame ->
                eventPublisher.publishEvent(PlayerJoinedEvent(updatedGame.code, player.id, player.name))
                eventPublisher.publishEvent(GameStateChangedEvent(updatedGame.code, updatedGame))
            }.map { JoinResult(game.id, game.code, player) }
    }

    fun gameState(gameCode: GameCode): Result<Game, PubGolfFailure> = gameRepository.findByCodeIgnoreCase(gameCode)

    fun submitScore(
        gameCode: GameCode,
        playerId: PlayerId,
        hole: Hole,
        score: Score,
        penaltyType: PenaltyType? = null,
    ): Result<Unit, PubGolfFailure> =
        retryOnConcurrentModification {
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
                        }.map { }
                }
        }

    fun randomise(
        gameCode: GameCode,
        playerId: PlayerId,
    ): Result<RandomiseResult, PubGolfFailure> =
        retryOnConcurrentModification {
            gameRepository
                .findByCodeIgnoreCase(gameCode)
                .flatMap { isNotCompleted(it, "Cannot randomise on completed game") }
                .flatMap { hasPlayerById(it, playerId) }
                .flatMap { hasUsedRandomise(it, playerId) }
                .flatMap { game ->
                    generateRandomiseResult(playerId, game)
                }
        }

    fun completeGame(
        gameCode: GameCode,
        playerId: PlayerId,
    ): Result<Game, PubGolfFailure> =
        retryOnConcurrentModification {
            gameRepository
                .findByCodeIgnoreCase(gameCode)
                .flatMap { isNotCompleted(it, "Game is already completed") }
                .flatMap { isHost(it, playerId, "complete this game") }
                .flatMap { game ->
                    val completed = game.copy(status = GameStatus.COMPLETED, activeEvent = null)
                    gameRepository
                        .save(completed)
                        .peek { completedGame ->
                            eventPublisher.publishEvent(GameCompletedEvent(completedGame.code))
                            eventPublisher.publishEvent(GameStateChangedEvent(completedGame.code, completedGame))
                        }
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
        retryOnConcurrentModification {
            gameRepository
                .findByCodeIgnoreCase(gameCode)
                .flatMap { isNotCompleted(it, "Cannot activate event on completed game") }
                .flatMap { isHost(it, playerId, "activate events") }
                .flatMap { hasNoActiveEvent(it) }
                .flatMap { game ->
                    val event =
                        GameEvent.fromId(eventId)
                            ?: return@flatMap Failure(EventNotFoundFailure("Event '$eventId' not found"))
                    val activeEvent =
                        ActiveEvent(event = event, customTitle = null, customDescription = null, activatedAt = Instant.now())
                    val updated = game.copy(activeEvent = activeEvent)
                    gameRepository
                        .save(updated)
                        .peek { updatedGame ->
                            eventPublisher.publishEvent(EventActivatedEvent(updatedGame.code, event.id, event.title))
                            eventPublisher.publishEvent(GameStateChangedEvent(updatedGame.code, updatedGame))
                        }
                }
        }

    fun activateCustomEvent(
        gameCode: GameCode,
        playerId: PlayerId,
        title: String,
        description: String?,
    ): Result<Game, PubGolfFailure> =
        retryOnConcurrentModification {
            gameRepository
                .findByCodeIgnoreCase(gameCode)
                .flatMap { isNotCompleted(it, "Cannot activate event on completed game") }
                .flatMap { isHost(it, playerId, "activate events") }
                .flatMap { hasNoActiveEvent(it) }
                .flatMap { game ->
                    val trimmedTitle = title.trim()
                    val trimmedDescription = description?.trim().takeUnless { it.isNullOrEmpty() }
                    val activeEvent =
                        ActiveEvent(
                            event = null,
                            customTitle = trimmedTitle,
                            customDescription = trimmedDescription,
                            activatedAt = Instant.now(),
                        )
                    val updated = game.copy(activeEvent = activeEvent)
                    gameRepository
                        .save(updated)
                        .peek { updatedGame ->
                            eventPublisher.publishEvent(EventActivatedEvent(updatedGame.code, "custom", trimmedTitle))
                            eventPublisher.publishEvent(GameStateChangedEvent(updatedGame.code, updatedGame))
                        }
                }
        }

    fun endEvent(
        gameCode: GameCode,
        playerId: PlayerId,
    ): Result<Game, PubGolfFailure> =
        retryOnConcurrentModification {
            gameRepository
                .findByCodeIgnoreCase(gameCode)
                .flatMap { isHost(it, playerId, "end events") }
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
        }

    // Replaces the whole course. Pars feed par-relative ranking, so an edit mid-game
    // re-ranks the leaderboard as soon as the new state is broadcast.
    fun setCourse(
        gameCode: GameCode,
        playerId: PlayerId,
        holes: List<CourseHole>,
    ): Result<Game, PubGolfFailure> =
        retryOnConcurrentModification {
            validateCourse(holes)
                .flatMap { gameRepository.findByCodeIgnoreCase(gameCode) }
                .flatMap { isNotCompleted(it, "Cannot change the course of a completed game") }
                .flatMap { isHost(it, playerId, "change drinks and pars") }
                .flatMap { game ->
                    val course = normaliseCourse(holes)
                    gameRepository
                        .save(game.copy(holes = course))
                        .peek { updatedGame ->
                            eventPublisher.publishEvent(CourseUpdatedEvent(updatedGame.code, routeNames(course)))
                            eventPublisher.publishEvent(GameStateChangedEvent(updatedGame.code, updatedGame))
                        }
                }
        }

    private fun validateCourse(holes: List<CourseHole>): Result<List<CourseHole>, PubGolfFailure> {
        val expectedHoles = (1..GameConstants.MAX_HOLES).map { Hole(it) }
        if (holes.map { it.hole }.sortedBy { it.value } != expectedHoles) {
            return Failure(InvalidCourseFailure("Each hole from 1 to ${GameConstants.MAX_HOLES} must be set exactly once"))
        }
        holes.firstOrNull { it.par < MIN_PAR || it.par > MAX_PAR }?.let {
            return Failure(InvalidCourseFailure("Par for hole ${it.hole.value} must be between $MIN_PAR and $MAX_PAR"))
        }

        val routes = routeNames(holes)
        if (routes.isEmpty() || routes.size > MAX_ROUTES) {
            return Failure(InvalidCourseFailure("A course needs between 1 and $MAX_ROUTES routes"))
        }
        if (routes.any { it.isBlank() }) {
            return Failure(InvalidCourseFailure("Route names must not be blank"))
        }
        routes.firstOrNull { it.trim().length > MAX_ROUTE_NAME_LENGTH }?.let {
            return Failure(InvalidCourseFailure("Route name `$it` must be $MAX_ROUTE_NAME_LENGTH characters or fewer"))
        }
        if (routes.map { it.trim().lowercase() }.distinct().size != routes.size) {
            return Failure(InvalidCourseFailure("Route names must be unique"))
        }

        val trimmedRoutes = routes.map { it.trim() }
        val expectedRoutes = trimmedRoutes.toSet()
        holes.forEach { hole ->
            // Set comparison: a hole may list its routes in any order, and normaliseCourse
            // then rewrites every hole into the order hole 1 declared.
            val holeRoutes =
                hole.drinks.keys
                    .map { it.trim() }
                    .toSet()
            if (hole.drinks.size != trimmedRoutes.size || holeRoutes != expectedRoutes) {
                return Failure(InvalidCourseFailure("Hole ${hole.hole.value} must have a drink for every route"))
            }
            hole.drinks.forEach { (route, drink) ->
                if (drink.isBlank()) {
                    return Failure(InvalidCourseFailure("Drink for hole ${hole.hole.value} on `$route` must not be blank"))
                }
                if (drink.trim().length > MAX_DRINK_LENGTH) {
                    return Failure(
                        InvalidCourseFailure("Drink for hole ${hole.hole.value} on `$route` must be $MAX_DRINK_LENGTH characters or fewer"),
                    )
                }
            }
        }

        return Success(holes)
    }

    // Sorts by hole and trims names so stored key order is the display order for every hole.
    private fun normaliseCourse(holes: List<CourseHole>): List<CourseHole> {
        val routes = routeNames(holes).map { it.trim() }
        return holes
            .sortedBy { it.hole.value }
            .map { hole ->
                val trimmed = hole.drinks.entries.associate { (route, drink) -> route.trim() to drink.trim() }
                hole.copy(drinks = routes.associateWith { trimmed.getValue(it) })
            }
    }

    // Route order comes from the lowest-numbered hole; every hole is validated to match it.
    private fun routeNames(holes: List<CourseHole>): List<String> =
        holes
            .minByOrNull { it.hole.value }
            ?.drinks
            ?.keys
            ?.toList()
            .orEmpty()

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
        action: String,
    ): Result<Game, PubGolfFailure> =
        if (game.hostPlayerId != playerId) {
            Failure(NotHostPlayerFailure("Only the host can $action"))
        } else {
            Success(game)
        }

    private fun <T> retryOnConcurrentModification(operation: () -> Result<T, PubGolfFailure>): Result<T, PubGolfFailure> {
        var result = operation()
        repeat(CONCURRENT_MODIFICATION_ATTEMPTS - 1) {
            if (result.failureOrNull() !is ConcurrentModificationFailure) return result
            result = operation()
        }
        return result
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
                    eventPublisher.publishEvent(
                        RandomiseUsedEvent(
                            updatedGame.code,
                            playerId,
                            randomiseHole,
                            outcome.label,
                        ),
                    )
                    eventPublisher.publishEvent(GameStateChangedEvent(updatedGame.code, updatedGame))
                }.flatMap {
                    Success(RandomiseResult(result = outcome.label, hole = randomiseHole))
                }
        }
    }

    private fun randomiseHole(
        game: Game,
        playerId: PlayerId,
    ): Result<Hole, PubGolfFailure> {
        val scores = game.players.first { it.id == playerId }.scores
        val firstUnplayed =
            (1..GameConstants.MAX_HOLES)
                .map { Hole(it) }
                .firstOrNull { it !in scores }
                ?: return Failure(NoHolesLeftFailure("No more holes left"))
        return Success(firstUnplayed)
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
