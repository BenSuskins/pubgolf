package uk.co.suskins.pubgolf.api

data class PlayerDto(
    val name: String,
    val scores: List<Int>,
    val totalScore: Int
)
