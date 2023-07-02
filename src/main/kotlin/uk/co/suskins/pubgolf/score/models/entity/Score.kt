package uk.co.suskins.pubgolf.score.models.entity

import jakarta.persistence.Id
import jakarta.persistence.Table
import java.util.UUID

@Table(name = "score")
data class Score(
    @Id val id: UUID, val holeOne: Int, val holeTwo: Int,
    val holeThree: Int, val holeFour: Int, val holeFive: Int, val holeSix: Int,
    val holeSeven: Int, val holeEight: Int, val holeNine: Int
)
