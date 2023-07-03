package uk.co.suskins.pubgolf.score.models.api

import jakarta.validation.constraints.*
import java.util.*

data class ScoreDto(
    @NotNull
    val id: UUID,
    @Size(min = 2, max = 20)
    @NotNull
    @NotBlank
    @Pattern(regexp = "^[a-zA-Z]*$")
    val name: String,
    @Min(-10)
    @Max(10)
    val holeOne: Int,
    @Min(-10)
    @Max(10)
    val holeTwo: Int,
    @Min(-10)
    @Max(10)
    val holeThree: Int,
    @Min(-10)
    @Max(10)
    val holeFour: Int,
    @Min(-10)
    @Max(10)
    val holeFive: Int,
    @Min(-10)
    @Max(10)
    val holeSix: Int,
    @Min(-10)
    @Max(10)
    val holeSeven: Int,
    @Min(-10)
    @Max(10)
    val holeEight: Int,
    @Min(-10)
    @Max(10)
    val holeNine: Int,
    @Min(-10)
    @Max(90)
    val total: Int
)
