package uk.co.suskins.pubgolf.adapter.routing

import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.fasterxml.jackson.annotation.JsonProperty
import dev.forkhandles.result4k.Result
import dev.forkhandles.result4k.Success
import dev.forkhandles.result4k.mapFailure
import dev.forkhandles.result4k.resultFrom
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.web.client.RestTemplate
import uk.co.suskins.pubgolf.models.Pub
import uk.co.suskins.pubgolf.models.PubGolfFailure
import uk.co.suskins.pubgolf.models.RouteGeometry
import uk.co.suskins.pubgolf.models.RoutingFailure
import uk.co.suskins.pubgolf.service.RoutingService

@JsonIgnoreProperties(ignoreUnknown = true)
data class OsrmRoute(
    @JsonProperty("geometry")
    val geometry: OsrmGeometry,
)

@JsonIgnoreProperties(ignoreUnknown = true)
data class OsrmGeometry(
    @JsonProperty("type")
    val type: String,
    @JsonProperty("coordinates")
    val coordinates: List<List<Double>>,
)

@JsonIgnoreProperties(ignoreUnknown = true)
data class OsrmResponse(
    @JsonProperty("code")
    val code: String,
    @JsonProperty("routes")
    val routes: List<OsrmRoute>?,
)

@Service
class OsrmRoutingAdapter(
    @Value("\${routing.osrm.baseUrl:https://router.project-osrm.org}")
    private val baseUrl: String,
    @Value("\${routing.osrm.profile:foot}")
    private val profile: String,
    private val restTemplate: RestTemplate = RestTemplate(),
) : RoutingService {
    private val logger = LoggerFactory.getLogger(OsrmRoutingAdapter::class.java)

    override fun calculateRoute(pubs: List<Pub>): Result<RouteGeometry?, PubGolfFailure> {
        if (pubs.isEmpty()) {
            return Success(null)
        }

        return resultFrom {
            val url = buildUrl(pubs)
            val response = restTemplate.getForObject(url, OsrmResponse::class.java)

            if (response?.code == "Ok" && response.routes?.isNotEmpty() == true) {
                val geometry = response.routes.first().geometry
                RouteGeometry(
                    type = geometry.type,
                    coordinates = geometry.coordinates,
                )
            } else {
                logger.warn("OSRM returned non-Ok response: ${response?.code}")
                null
            }
        }.mapFailure { error ->
            logger.error("Error calculating route", error)
            RoutingFailure("Failed to calculate route: ${error.message}")
        }
    }

    private fun buildUrl(pubs: List<Pub>): String {
        val coordinates =
            pubs
                .sortedBy { it.hole.value }
                .joinToString(";") { "${it.longitude},${it.latitude}" }
        return "$baseUrl/route/v1/$profile/$coordinates?overview=full&geometries=geojson"
    }
}
