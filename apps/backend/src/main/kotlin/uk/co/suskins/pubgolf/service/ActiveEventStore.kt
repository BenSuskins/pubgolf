package uk.co.suskins.pubgolf.service

import org.springframework.stereotype.Service
import uk.co.suskins.pubgolf.models.Event
import uk.co.suskins.pubgolf.models.GameCode
import java.util.concurrent.ConcurrentHashMap

@Service
class ActiveEventStore {
    private val activeEvents = ConcurrentHashMap<GameCode, Event>()

    fun getActiveEvent(gameCode: GameCode): Event? = activeEvents[gameCode]

    fun setActiveEvent(
        gameCode: GameCode,
        event: Event,
    ) {
        activeEvents[gameCode] = event
    }

    fun clearActiveEvent(gameCode: GameCode): Event? = activeEvents.remove(gameCode)

    fun hasActiveEvent(gameCode: GameCode): Boolean = activeEvents.containsKey(gameCode)
}
