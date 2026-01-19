package uk.co.suskins.pubgolf.controller

import dev.forkhandles.result4k.get
import dev.forkhandles.result4k.map
import dev.forkhandles.result4k.mapFailure
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.constraints.Size
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import uk.co.suskins.pubgolf.models.PlaceSearchFailure
import uk.co.suskins.pubgolf.service.PlaceSearchService

@Validated
@RestController
@RequestMapping("/api/v1/places")
class PlacesController(
    private val placeSearchService: PlaceSearchService,
) {
    private val logger = LoggerFactory.getLogger(PlacesController::class.java)

    @GetMapping("/search")
    fun search(
        @RequestParam("q")
        @Size(min = 1, max = 200, message = "Query must be between 1 and 200 characters")
        query: String,
        @RequestParam("lat", required = false) latitude: Double?,
        @RequestParam("lng", required = false) longitude: Double?,
        request: HttpServletRequest,
    ): ResponseEntity<Any> {
        val clientIp = extractClientIp(request)

        return placeSearchService
            .search(query, clientIp, latitude, longitude)
            .map { results -> ResponseEntity.ok<Any>(results) }
            .mapFailure { failure ->
                logger.error("Failed to search places: ${failure.message}")
                val status =
                    if (failure is PlaceSearchFailure) {
                        HttpStatus.SERVICE_UNAVAILABLE
                    } else {
                        HttpStatus.INTERNAL_SERVER_ERROR
                    }
                ResponseEntity.status(status).body<Any>(failure.asErrorResponse())
            }.get()
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
