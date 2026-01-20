package uk.co.suskins.pubgolf.config

import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.ServletRequestBindingException
import org.springframework.web.bind.annotation.ControllerAdvice
import org.springframework.web.bind.annotation.ExceptionHandler
import uk.co.suskins.pubgolf.models.ErrorResponse

@ControllerAdvice
@Order(Ordered.HIGHEST_PRECEDENCE)
class ValidationExceptionHandler {
    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidation(e: MethodArgumentNotValidException): ResponseEntity<ErrorResponse> {
        val message =
            e.bindingResult
                .fieldErrors
                .joinToString(", ") { "${it.field}: ${it.defaultMessage}" }

        return ResponseEntity
            .badRequest()
            .body(ErrorResponse("Validation failed: $message"))
    }

    @ExceptionHandler(MissingPlayerIdHeaderException::class)
    fun handleMissingPlayerId(e: MissingPlayerIdHeaderException): ResponseEntity<ErrorResponse> =
        ResponseEntity
            .status(HttpStatus.UNAUTHORIZED)
            .body(ErrorResponse(e.message ?: "Unauthorized"))

    @ExceptionHandler(ServletRequestBindingException::class)
    fun handleServletRequestBinding(e: ServletRequestBindingException): ResponseEntity<ErrorResponse> {
        // If it's our custom exception, return 401
        if (e is MissingPlayerIdHeaderException) {
            return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(ErrorResponse(e.message ?: "Unauthorized"))
        }
        // Otherwise, return 400 for other binding exceptions
        return ResponseEntity
            .badRequest()
            .body(ErrorResponse(e.message ?: "Bad Request"))
    }
}
