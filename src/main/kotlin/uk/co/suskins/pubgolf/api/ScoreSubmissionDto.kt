package uk.co.suskins.pubgolf.api

import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min

data class ScoreSubmissionDto(
    @field:Min(1) @field:Max(9)
    val hole: Int,
    @field:Min(-10) @field:Max(10)
    val score: Int
)
