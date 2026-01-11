package uk.co.suskins.pubgolf.config

import org.springframework.context.annotation.Configuration
import org.springframework.web.socket.config.annotation.EnableWebSocket
import org.springframework.web.socket.config.annotation.WebSocketConfigurer
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry
import uk.co.suskins.pubgolf.websocket.GameWebSocketHandler

@Configuration
@EnableWebSocket
class WebSocketConfig(
    private val gameWebSocketHandler: GameWebSocketHandler,
    private val applicationProperties: ApplicationProperties,
) : WebSocketConfigurer {
    override fun registerWebSocketHandlers(registry: WebSocketHandlerRegistry) {
        registry
            .addHandler(gameWebSocketHandler, "/ws/games/*")
            .setAllowedOrigins(*applicationProperties.origins.toTypedArray())
    }
}
