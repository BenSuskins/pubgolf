package uk.co.suskins.pubgolf.events

class GameEventCaptor {
    val capturedEvents = mutableListOf<GameEvent>()

    fun captureEvent(event: GameEvent) {
        capturedEvents.add(event)
    }

    fun getEvents(): List<GameEvent> = capturedEvents.toList()

    inline fun <reified T : GameEvent> getEventsOfType(): List<T> = capturedEvents.filterIsInstance<T>()

    fun clear() {
        capturedEvents.clear()
    }

    fun assertEventPublished(predicate: (GameEvent) -> Boolean): GameEvent =
        capturedEvents.find(predicate)
            ?: throw AssertionError("No event matching predicate found")
}
