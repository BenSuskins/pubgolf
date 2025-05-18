package uk.co.suskins.pubgolf.config

import org.springframework.http.ResponseEntity
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ControllerAdvice
import org.springframework.web.bind.annotation.ExceptionHandler
import uk.co.suskins.pubgolf.models.ErrorResponse

@ControllerAdvice
class ValidationExceptionHandler {
    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidation(e: MethodArgumentNotValidException): ResponseEntity<ErrorResponse> {
        val message = e.bindingResult
            .fieldErrors
            .joinToString(", ") { "${it.field}: ${it.defaultMessage}" }

        return ResponseEntity
            .badRequest()
            .body(ErrorResponse("Validation failed: $message"))
    }
}