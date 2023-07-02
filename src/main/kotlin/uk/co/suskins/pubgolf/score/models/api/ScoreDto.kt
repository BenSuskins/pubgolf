package uk.co.suskins.pubgolf.score.models.api

import java.util.*

data class ScoreDto(
    val id: UUID, val holeOne: Int, val holeTwo: Int,
    val holeThree: Int, val holeFour: Int, val holeFive: Int, val holeSix: Int,
    val holeSeven: Int, val holeEight: Int, val holeNine: Int, val total: Int
)
