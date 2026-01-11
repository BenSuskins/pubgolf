package uk.co.suskins.pubgolf.websocket

import com.fasterxml.jackson.databind.ObjectMapper
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import org.springframework.web.socket.CloseStatus
import org.springframework.web.socket.TextMessage
import org.springframework.web.socket.WebSocketSession
import org.springframework.web.socket.handler.TextWebSocketHandler
import uk.co.suskins.pubgolf.models.GameCode
import uk.co.suskins.pubgolf.models.WebSocketMessage
import java.util.concurrent.ConcurrentHashMap

@Component
class GameWebSocketHandler(
    private val objectMapper: ObjectMapper,
) : TextWebSocketHandler() {
    private val logger = LoggerFactory.getLogger(GameWebSocketHandler::class.java)
    private val sessions = ConcurrentHashMap<GameCode, MutableSet<WebSocketSession>>()

    override fun afterConnectionEstablished(session: WebSocketSession) {
        val gameCode = extractGameCode(session)
        if (gameCode == null) {
            logger.warn("WebSocket connection rejected: no game code in URI")
            session.close(CloseStatus.BAD_DATA)
            return
        }

        val gameSessions = sessions.computeIfAbsent(gameCode) { ConcurrentHashMap.newKeySet() }
        gameSessions.add(session)

        logger.info("WebSocket connected for game ${gameCode.value}, session ${session.id}")
    }

    override fun afterConnectionClosed(
        session: WebSocketSession,
        status: CloseStatus,
    ) {
        val gameCode = extractGameCode(session) ?: return

        sessions[gameCode]?.remove(session)
        if (sessions[gameCode]?.isEmpty() == true) {
            sessions.remove(gameCode)
        }

        logger.info("WebSocket disconnected for game ${gameCode.value}, session ${session.id}")
    }

    fun broadcast(
        gameCode: GameCode,
        message: WebSocketMessage,
    ) {
        val gameSessions = sessions[gameCode] ?: return
        val json = objectMapper.writeValueAsString(message)
        val textMessage = TextMessage(json)

        gameSessions.forEach { session ->
            try {
                if (session.isOpen) {
                    session.sendMessage(textMessage)
                }
            } catch (e: Exception) {
                logger.error("Failed to send WebSocket message to session ${session.id}", e)
            }
        }
    }

    fun closeAllSessions(gameCode: GameCode) {
        val gameSessions = sessions.remove(gameCode) ?: return

        gameSessions.forEach { session ->
            try {
                if (session.isOpen) {
                    session.close(CloseStatus.NORMAL)
                }
            } catch (e: Exception) {
                logger.error("Failed to close WebSocket session ${session.id}", e)
            }
        }
    }

    fun getSessionCount(gameCode: GameCode): Int = sessions[gameCode]?.size ?: 0

    private fun extractGameCode(session: WebSocketSession): GameCode? {
        val uri = session.uri ?: return null
        val path = uri.path
        val regex = Regex("/ws/games/([^/]+)")
        val matchResult = regex.find(path) ?: return null
        return GameCode(matchResult.groupValues[1])
    }
}
