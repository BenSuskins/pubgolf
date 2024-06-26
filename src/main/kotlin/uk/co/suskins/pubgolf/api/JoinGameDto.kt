package uk.co.suskins.pubgolf.api

import com.fasterxml.jackson.annotation.JsonProperty
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min

data class JoinGameDto(
    @JsonProperty("name")
    @field:Min(2) @field:Max(40)
    val name: String
)
