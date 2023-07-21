package uk.co.suskins.pubgolf.score.models.entity

import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.util.*

@Entity
@Table(name = "score")
data class Score(
    @Id val id: UUID = UUID.randomUUID(),
    var name: String= "",
    var holeOne: Int = 0,
    var holeTwo: Int = 0,
    var holeThree: Int = 0,
    var holeFour: Int = 0,
    var holeFive: Int = 0,
    var holeSix: Int = 0,
    var holeSeven: Int = 0,
    var holeEight: Int = 0,
    var holeNine: Int = 0
)
