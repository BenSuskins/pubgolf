package uk.co.suskins.pubgolf.config

import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import uk.co.suskins.pubgolf.controller.GameNotFoundException
import uk.co.suskins.pubgolf.controller.PlayerNotFoundException

@RestControllerAdvice
class ExceptionHandler {

    @ExceptionHandler(IllegalArgumentException::class)
    fun handleIllegalArgument(ex: IllegalArgumentException): ResponseEntity<String> {
        return ResponseEntity.badRequest().body(ex.message)
    }

    @ExceptionHandler(GameNotFoundException::class)
    fun handleGameNotFoundException(ex: GameNotFoundException): ResponseEntity<String> {
        return ResponseEntity.status(404).body(ex.message)
    }

    @ExceptionHandler(PlayerNotFoundException::class)
    fun handlePlayerNotFoundException(ex: PlayerNotFoundException): ResponseEntity<String> {
        return ResponseEntity.status(404).body(ex.message)
    }
}