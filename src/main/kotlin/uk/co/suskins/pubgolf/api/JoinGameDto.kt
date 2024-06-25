package uk.co.suskins.pubgolf.api

import com.fasterxml.jackson.annotation.JsonProperty

data class JoinGameDto(
    @JsonProperty("name")
    val name: String
)
