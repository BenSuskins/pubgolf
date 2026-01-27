package uk.co.suskins.pubgolf.events

import uk.co.suskins.pubgolf.models.Game
import uk.co.suskins.pubgolf.models.GameCode
import uk.co.suskins.pubgolf.models.GameId
import uk.co.suskins.pubgolf.models.Hole
import uk.co.suskins.pubgolf.models.PlayerId
import uk.co.suskins.pubgolf.models.PlayerName
import uk.co.suskins.pubgolf.models.Score
import java.time.Instant

sealed interface GameEvent {
    val gameCode: GameCode
    val timestamp: Instant
}

data class GameCreatedEvent(
    override val gameCode: GameCode,
    val gameId: GameId,
    override val timestamp: Instant = Instant.now(),
) : GameEvent

data class PlayerJoinedEvent(
    override val gameCode: GameCode,
    val playerId: PlayerId,
    val playerName: PlayerName,
    override val timestamp: Instant = Instant.now(),
) : GameEvent

data class ScoreSubmittedEvent(
    override val gameCode: GameCode,
    val playerId: PlayerId,
    val hole: Hole,
    val score: Score,
    override val timestamp: Instant = Instant.now(),
) : GameEvent

data class RandomiseUsedEvent(
    override val gameCode: GameCode,
    val playerId: PlayerId,
    val hole: Hole,
    val result: String,
    override val timestamp: Instant = Instant.now(),
) : GameEvent

data class GameCompletedEvent(
    override val gameCode: GameCode,
    override val timestamp: Instant = Instant.now(),
) : GameEvent

data class GameStateChangedEvent(
    override val gameCode: GameCode,
    val game: Game,
    override val timestamp: Instant = Instant.now(),
) : GameEvent

data class EventActivatedEvent(
    override val gameCode: GameCode,
    val eventId: String,
    val eventTitle: String,
    override val timestamp: Instant = Instant.now(),
) : GameEvent

data class EventEndedEvent(
    override val gameCode: GameCode,
    override val timestamp: Instant = Instant.now(),
) : GameEvent
