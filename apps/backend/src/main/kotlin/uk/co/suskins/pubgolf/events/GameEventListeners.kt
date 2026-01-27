package uk.co.suskins.pubgolf.events

import org.slf4j.LoggerFactory
import org.springframework.context.event.EventListener
import org.springframework.stereotype.Component
import org.springframework.transaction.event.TransactionPhase
import org.springframework.transaction.event.TransactionalEventListener
import uk.co.suskins.pubgolf.service.GameMetrics
import uk.co.suskins.pubgolf.service.GameStateBroadcaster

@Component
class GameStateBroadcasterListener(
    private val gameStateBroadcaster: GameStateBroadcaster
) {
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun onGameStateChanged(event: GameStateChangedEvent) {
        gameStateBroadcaster.broadcast(event.game)
    }
}

@Component
class GameMetricsListener(
    private val gameMetrics: GameMetrics
) {
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun onGameCreated(event: GameCreatedEvent) {
        gameMetrics.gameCreated()
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun onPlayerJoined(event: PlayerJoinedEvent) {
        gameMetrics.playerJoined()
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun onScoreSubmitted(event: ScoreSubmittedEvent) {
        gameMetrics.scoreSubmitted(event.hole)
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun onRandomiseUsed(event: RandomiseUsedEvent) {
        gameMetrics.randomiseUsed()
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun onGameCompleted(event: GameCompletedEvent) {
        gameMetrics.gameCompleted()
    }
}

@Component
class GameLoggingListener {
    private val logger = LoggerFactory.getLogger(GameLoggingListener::class.java)

    @EventListener
    fun onGameCreated(event: GameCreatedEvent) {
        logger.info("Game ${event.gameCode.value} created.")
    }

    @EventListener
    fun onGameCompleted(event: GameCompletedEvent) {
        logger.info("Game ${event.gameCode.value} completed.")
    }

    @EventListener
    fun onEventActivated(event: EventActivatedEvent) {
        logger.info("Event '${event.eventTitle}' activated for game ${event.gameCode.value}")
    }

    @EventListener
    fun onEventEnded(event: EventEndedEvent) {
        logger.info("Event ended for game ${event.gameCode.value}")
    }
}
