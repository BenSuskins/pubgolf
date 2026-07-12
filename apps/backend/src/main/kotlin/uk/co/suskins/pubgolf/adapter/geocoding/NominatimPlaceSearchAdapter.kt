package uk.co.suskins.pubgolf.adapter.geocoding

import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.fasterxml.jackson.annotation.JsonProperty
import dev.forkhandles.result4k.Failure
import dev.forkhandles.result4k.Result
import dev.forkhandles.result4k.mapFailure
import dev.forkhandles.result4k.resultFrom
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod
import org.springframework.stereotype.Service
import org.springframework.web.client.RestTemplate
import org.springframework.web.util.UriComponentsBuilder
import uk.co.suskins.pubgolf.models.PlaceSearchFailure
import uk.co.suskins.pubgolf.models.PlaceSearchResult
import uk.co.suskins.pubgolf.models.PubGolfFailure
import uk.co.suskins.pubgolf.service.PlaceSearchService
import java.net.URI
import java.util.concurrent.TimeUnit
import java.util.concurrent.locks.ReentrantLock

private const val MAX_WAIT_FOR_SLOT_MS = 5_000L

@JsonIgnoreProperties(ignoreUnknown = true)
data class NominatimResponse(
    @JsonProperty("display_name")
    val displayName: String,
    @JsonProperty("lat")
    val lat: String,
    @JsonProperty("lon")
    val lon: String,
)

@Service
class NominatimPlaceSearchAdapter(
    @Value("\${geocoding.nominatim.baseUrl:https://nominatim.openstreetmap.org}")
    private val baseUrl: String,
    @Value("\${geocoding.nominatim.userAgent:PubGolf/1.0}")
    private val userAgent: String,
    @Value("\${geocoding.nominatim.rateLimit.delayMs:1000}")
    private val rateLimitDelayMs: Long,
    @Value("\${geocoding.nominatim.resultLimit:5}")
    private val resultLimit: Int,
    private val restTemplate: RestTemplate,
) : PlaceSearchService {
    private val logger = LoggerFactory.getLogger(NominatimPlaceSearchAdapter::class.java)

    // Nominatim's usage policy allows one request per second, so upstream calls are
    // serialised with a minimum interval. Waiters are bounded: rather than queueing
    // indefinitely on servlet threads, callers give up after MAX_WAIT_FOR_SLOT_MS.
    private val upstreamLock = ReentrantLock(true)
    private var nextRequestAllowedAt = 0L

    override fun search(
        query: String,
        latitude: Double?,
        longitude: Double?,
    ): Result<List<PlaceSearchResult>, PubGolfFailure> {
        if (!upstreamLock.tryLock(MAX_WAIT_FOR_SLOT_MS, TimeUnit.MILLISECONDS)) {
            return Failure(PlaceSearchFailure("Place search is busy — please try again in a moment"))
        }
        return try {
            val waitMs = nextRequestAllowedAt - System.currentTimeMillis()
            if (waitMs > 0) {
                Thread.sleep(waitMs)
            }
            fetch(query, latitude, longitude)
        } finally {
            nextRequestAllowedAt = System.currentTimeMillis() + rateLimitDelayMs
            upstreamLock.unlock()
        }
    }

    private fun fetch(
        query: String,
        latitude: Double?,
        longitude: Double?,
    ): Result<List<PlaceSearchResult>, PubGolfFailure> =
        resultFrom {
            val uri = buildUri(query, latitude, longitude)
            val headers =
                HttpHeaders().apply {
                    set("User-Agent", userAgent)
                }
            val entity = HttpEntity<String>(headers)

            val response = restTemplate.exchange(uri, HttpMethod.GET, entity, Array<NominatimResponse>::class.java)
            val results = response.body ?: emptyArray()

            results.take(resultLimit).map {
                PlaceSearchResult(
                    name = it.displayName,
                    latitude = it.lat.toDouble(),
                    longitude = it.lon.toDouble(),
                )
            }
        }.mapFailure { error ->
            logger.error("Error searching Nominatim for query: $query", error)
            PlaceSearchFailure("Failed to search places: ${error.message}")
        }

    private fun buildUri(
        query: String,
        latitude: Double?,
        longitude: Double?,
    ): URI {
        val builder =
            UriComponentsBuilder
                .fromUriString(baseUrl)
                .path("/search")
                .queryParam("q", "{query}")
                .queryParam("format", "json")
                .queryParam("limit", "{limit}")
        val variables = mutableMapOf<String, Any>("query" to query, "limit" to resultLimit)

        if (latitude != null && longitude != null) {
            val latDelta = 0.045
            val lngDelta = 0.045
            // Bias results towards the viewbox without excluding matches outside it.
            builder.queryParam("viewbox", "{viewbox}")
            variables["viewbox"] =
                "${longitude - lngDelta},${latitude - latDelta},${longitude + lngDelta},${latitude + latDelta}"
        }

        val uri = builder.encode().buildAndExpand(variables).toUri()
        // The search text is expanded into encoded query values only; it must never
        // influence where the request goes. Guard the host as defence in depth.
        require(uri.host == URI(baseUrl).host) { "Place search request escaped the configured host" }
        return uri
    }
}
