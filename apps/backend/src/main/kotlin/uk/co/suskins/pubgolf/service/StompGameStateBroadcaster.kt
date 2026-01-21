package uk.co.suskins.pubgolf.service

import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Service
import uk.co.suskins.pubgolf.models.Game
import uk.co.suskins.pubgolf.models.toGameStateResponse

@Service
class StompGameStateBroadcaster(
    private val messagingTemplate: SimpMessagingTemplate,
) : GameStateBroadcaster {
    override fun broadcast(game: Game) {
        messagingTemplate.convertAndSend(
            "/topic/games/${game.code.value.lowercase()}",
            game.toGameStateResponse(),
        )
    }
}
