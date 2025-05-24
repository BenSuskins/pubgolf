package uk.co.suskins.pubgolf.models

import java.util.*

@JvmInline
value class GameCode(val value: String)

@JvmInline
value class PlayerName(val value: String)

@JvmInline
value class Score(val value: Int)

@JvmInline
value class Hole(val value: Int)

@JvmInline
value class PlayerId(val value: UUID)

@JvmInline
value class GameId(val value: UUID)
