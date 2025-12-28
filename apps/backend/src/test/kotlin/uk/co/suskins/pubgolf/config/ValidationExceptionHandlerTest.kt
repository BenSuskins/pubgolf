package uk.co.suskins.pubgolf.config

import com.natpryce.hamkrest.assertion.assertThat
import com.natpryce.hamkrest.equalTo
import org.junit.jupiter.api.Test
import org.springframework.core.MethodParameter
import org.springframework.http.HttpStatus
import org.springframework.validation.DataBinder
import org.springframework.validation.FieldError
import org.springframework.web.bind.MethodArgumentNotValidException

class ValidationExceptionHandlerTest {
    private val handler = ValidationExceptionHandler()
    private val methodParameter = MethodParameter(this::class.java.methods.first(), -1)

    @Test
    fun `formats single field error correctly`() {
        val bindingResult =
            DataBinder(Any()).bindingResult.apply {
                addError(FieldError("object", "name", "must not be blank"))
            }
        val exception = MethodArgumentNotValidException(methodParameter, bindingResult)

        val response = handler.handleValidation(exception)

        assertThat(response.statusCode, equalTo(HttpStatus.BAD_REQUEST))
        assertThat(response.body?.message, equalTo("Validation failed: name: must not be blank"))
    }

    @Test
    fun `formats multiple field errors with comma separator`() {
        val bindingResult =
            DataBinder(Any()).bindingResult.apply {
                addError(FieldError("object", "name", "must not be blank"))
                addError(FieldError("object", "score", "must be positive"))
            }
        val exception = MethodArgumentNotValidException(methodParameter, bindingResult)

        val response = handler.handleValidation(exception)

        assertThat(response.statusCode, equalTo(HttpStatus.BAD_REQUEST))
        assertThat(response.body?.message, equalTo("Validation failed: name: must not be blank, score: must be positive"))
    }

    @Test
    fun `returns empty validation message when no field errors`() {
        val bindingResult = DataBinder(Any()).bindingResult
        val exception = MethodArgumentNotValidException(methodParameter, bindingResult)

        val response = handler.handleValidation(exception)

        assertThat(response.statusCode, equalTo(HttpStatus.BAD_REQUEST))
        assertThat(response.body?.message, equalTo("Validation failed: "))
    }
}
