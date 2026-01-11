package uk.co.suskins.pubgolf.service

import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Service
import uk.co.suskins.pubgolf.models.Game
import uk.co.suskins.pubgolf.models.GameStateResponse
import uk.co.suskins.pubgolf.models.PenaltyResponse
import uk.co.suskins.pubgolf.models.PlayerResponse
import uk.co.suskins.pubgolf.models.RandomiseOutcomeResponse

@Service
class StompGameStateBroadcaster(
    private val messagingTemplate: SimpMessagingTemplate,
) : GameStateBroadcaster {
    override fun broadcast(game: Game) {
        val response = game.toGameStateResponse()
        messagingTemplate.convertAndSend(
            "/topic/games/${game.code.value.lowercase()}",
            response,
        )
    }

    private fun Game.toGameStateResponse() =
        GameStateResponse(
            gameId = id,
            gameCode = code,
            status = status,
            hostPlayerId = hostPlayerId,
            players =
                players
                    .map { player ->
                        PlayerResponse(
                            id = player.id,
                            name = player.name,
                            scores = player.scores.map { it.value.score },
                            totalScore = player.scores.map { it.value.score.value }.sum(),
                            randomise =
                                player.randomise?.let {
                                    RandomiseOutcomeResponse(it.hole, it.result.label)
                                },
                            penalties =
                                player.penalties.map { penalty ->
                                    PenaltyResponse(penalty.hole, penalty.type.name, penalty.type.points)
                                },
                        )
                    }.sortedBy { it.totalScore },
        )
}
