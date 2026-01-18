package uk.co.suskins.pubgolf.controller

import dev.forkhandles.result4k.get
import dev.forkhandles.result4k.mapFailure
import jakarta.servlet.http.HttpServletRequest
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import uk.co.suskins.pubgolf.models.PlaceSearchFailure
import uk.co.suskins.pubgolf.service.PlaceSearchService

@RestController
@RequestMapping("/api/v1/places")
class PlacesController(
    private val placeSearchService: PlaceSearchService,
) {
    private val logger = LoggerFactory.getLogger(PlacesController::class.java)

    @GetMapping("/search")
    fun search(
        @RequestParam("q") query: String,
        @RequestParam("lat", required = false) latitude: Double?,
        @RequestParam("lng", required = false) longitude: Double?,
        request: HttpServletRequest,
    ): ResponseEntity<Any> {
        val clientIp = extractClientIp(request)

        return placeSearchService
            .search(query, clientIp, latitude, longitude)
            .mapFailure { failure ->
                logger.error("Failed to search places: ${failure.message}")
                when (failure) {
                    is PlaceSearchFailure -> ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(failure.asErrorResponse())
                    else -> ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(failure.asErrorResponse())
                }
            }.get()
            .let { result ->
                when (result) {
                    is List<*> -> ResponseEntity.ok(result)
                    else -> result as ResponseEntity<Any>
                }
            }
    }

    private fun extractClientIp(request: HttpServletRequest): String {
        val xForwardedFor = request.getHeader("X-Forwarded-For")
        return if (xForwardedFor != null && xForwardedFor.isNotBlank()) {
            xForwardedFor.split(",").first().trim()
        } else {
            request.remoteAddr
        }
    }
}
