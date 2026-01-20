package uk.co.suskins.pubgolf.config

import org.springframework.core.MethodParameter
import org.springframework.stereotype.Component
import org.springframework.web.bind.ServletRequestBindingException
import org.springframework.web.bind.support.WebDataBinderFactory
import org.springframework.web.context.request.NativeWebRequest
import org.springframework.web.method.support.HandlerMethodArgumentResolver
import org.springframework.web.method.support.ModelAndViewContainer
import uk.co.suskins.pubgolf.models.PlayerId
import java.util.UUID

class MissingPlayerIdHeaderException(message: String) : ServletRequestBindingException(message)

@Component
class PlayerIdArgumentResolver : HandlerMethodArgumentResolver {
    companion object {
        const val HEADER_NAME = "PubGolf-Player-Id"
    }

    override fun supportsParameter(parameter: MethodParameter): Boolean =
        parameter.hasParameterAnnotation(AuthenticatedPlayer::class.java) &&
            parameter.parameterType == PlayerId::class.java

    override fun resolveArgument(
        parameter: MethodParameter,
        mavContainer: ModelAndViewContainer?,
        webRequest: NativeWebRequest,
        binderFactory: WebDataBinderFactory?,
    ): PlayerId {
        val headerValue =
            webRequest.getHeader(HEADER_NAME)
                ?: throw MissingPlayerIdHeaderException("Missing required header: $HEADER_NAME")

        return try {
            PlayerId(UUID.fromString(headerValue))
        } catch (e: IllegalArgumentException) {
            throw MissingPlayerIdHeaderException("Invalid player ID format in header: $headerValue")
        }
    }
}
