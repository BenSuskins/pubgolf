package uk.co.suskins.pubgolf.models

data class Event(
    val id: EventId,
    val name: String,
    val description: String,
)

@JvmInline
value class EventId(
    val value: String,
)

object PresetEvents {
    val all: List<Event> =
        listOf(
            Event(EventId("power-hour"), "Power Hour", "Everyone must finish their drink within the hour!"),
            Event(EventId("buddy-up"), "Buddy Up", "Find a partner - you're drinking as a team for the next hole!"),
            Event(EventId("lefty-lucy"), "Lefty Lucy", "Everyone must drink with their non-dominant hand!"),
            Event(EventId("silent-round"), "Silent Round", "No talking until the next hole - violators take a sip!"),
            Event(EventId("double-trouble"), "Double Trouble", "All sips count double for the next hole!"),
            Event(EventId("photo-bomb"), "Photo Bomb", "Group photo time! Last one in position takes a sip!"),
        )

    fun findById(id: EventId): Event? = all.find { it.id == id }
}
