package uk.co.suskins.pubgolf.config

import org.slf4j.LoggerFactory
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.transaction.UnexpectedRollbackException
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.ServletRequestBindingException
import org.springframework.web.bind.annotation.ControllerAdvice
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.method.annotation.HandlerMethodValidationException
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException
import uk.co.suskins.pubgolf.models.ErrorResponse

@ControllerAdvice
@Order(Ordered.HIGHEST_PRECEDENCE)
class ValidationExceptionHandler {
    private val logger = LoggerFactory.getLogger(ValidationExceptionHandler::class.java)

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

    @ExceptionHandler(ServletRequestBindingException::class)
    fun handleServletRequestBinding(exception: ServletRequestBindingException): ResponseEntity<ErrorResponse> =
        ResponseEntity
            .badRequest()
            .body(ErrorResponse(exception.message ?: "Bad Request"))

    @ExceptionHandler(HttpMessageNotReadableException::class)
    fun handleUnreadableBody(exception: HttpMessageNotReadableException): ResponseEntity<ErrorResponse> =
        ResponseEntity
            .badRequest()
            .body(ErrorResponse("Malformed request body"))

    @ExceptionHandler(MethodArgumentTypeMismatchException::class)
    fun handleTypeMismatch(exception: MethodArgumentTypeMismatchException): ResponseEntity<ErrorResponse> =
        ResponseEntity
            .badRequest()
            .body(ErrorResponse("Invalid value for parameter `${exception.name}`"))

    @ExceptionHandler(HandlerMethodValidationException::class)
    fun handleHandlerMethodValidation(exception: HandlerMethodValidationException): ResponseEntity<ErrorResponse> {
        val message =
            exception.parameterValidationResults
                .flatMap { result -> result.resolvableErrors.mapNotNull { it.defaultMessage } }
                .joinToString(", ")

        return ResponseEntity
            .badRequest()
            .body(ErrorResponse("Validation failed: $message"))
    }

    @ExceptionHandler(UnexpectedRollbackException::class)
    fun handleUnexpectedRollback(exception: UnexpectedRollbackException): ResponseEntity<ErrorResponse> {
        logger.error("Transaction rolled back unexpectedly", exception)
        return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ErrorResponse("Something went wrong — please try again"))
    }
}
