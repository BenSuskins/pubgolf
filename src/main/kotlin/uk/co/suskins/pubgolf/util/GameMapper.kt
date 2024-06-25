package uk.co.suskins.pubgolf.util


import uk.co.suskins.pubgolf.api.GameDto
import uk.co.suskins.pubgolf.api.PlayerDto
import uk.co.suskins.pubgolf.model.Game
import uk.co.suskins.pubgolf.model.Player

fun Game.toDto() = GameDto(
    identifier = this.identifier,
)

fun Player.toDto() = PlayerDto(
    name = this.name,
    scores = this.getScoresList(),
    totalScore = this.totalScore
)
