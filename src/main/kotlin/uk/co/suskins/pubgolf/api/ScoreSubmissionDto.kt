package uk.co.suskins.pubgolf.api

import com.fasterxml.jackson.annotation.JsonProperty
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min

data class ScoreSubmissionDto(
    @field:Min(1) @field:Max(9)
    @JsonProperty("hole")
    val hole: Int,
    @field:Min(-10) @field:Max(10)
    @JsonProperty("score")
    val score: Int
)
