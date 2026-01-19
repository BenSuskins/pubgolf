package uk.co.suskins.pubgolf.adapter.geocoding

import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.fasterxml.jackson.annotation.JsonProperty
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
import uk.co.suskins.pubgolf.models.PlaceSearchFailure
import uk.co.suskins.pubgolf.models.PlaceSearchResult
import uk.co.suskins.pubgolf.models.PubGolfFailure
import uk.co.suskins.pubgolf.service.PlaceSearchService
import java.net.URLEncoder
import java.nio.charset.StandardCharsets
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Semaphore

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
    private val rateLimiter = Semaphore(1)
    private val clientQueues = ConcurrentHashMap<String, String>()

    override fun search(
        query: String,
        clientIdentifier: String,
        latitude: Double?,
        longitude: Double?,
    ): Result<List<PlaceSearchResult>, PubGolfFailure> =
        resultFrom {
            clientQueues[clientIdentifier] = query

            rateLimiter.acquire()
            try {
                Thread.sleep(rateLimitDelayMs)

                val currentQuery = clientQueues[clientIdentifier]
                if (currentQuery != query) {
                    logger.debug("Query for client $clientIdentifier has been superseded, skipping")
                    return@resultFrom emptyList()
                }

                val url = buildUrl(query, latitude, longitude)
                val headers =
                    HttpHeaders().apply {
                        set("User-Agent", userAgent)
                    }
                val entity = HttpEntity<String>(headers)

                val response = restTemplate.exchange(url, HttpMethod.GET, entity, Array<NominatimResponse>::class.java)
                val results = response.body ?: emptyArray()

                results.take(resultLimit).map {
                    PlaceSearchResult(
                        name = it.displayName,
                        latitude = it.lat.toDouble(),
                        longitude = it.lon.toDouble(),
                    )
                }
            } finally {
                clientQueues.remove(clientIdentifier)
                rateLimiter.release()
            }
        }.mapFailure { error ->
            logger.error("Error searching Nominatim for query: $query", error)
            PlaceSearchFailure("Failed to search places: ${error.message}")
        }

    private fun buildUrl(
        query: String,
        latitude: Double?,
        longitude: Double?,
    ): String {
        val searchUrl = "$baseUrl/search"
        val encodedQuery = URLEncoder.encode(query, StandardCharsets.UTF_8)
        val params = mutableListOf("q=$encodedQuery", "format=json", "limit=$resultLimit")

        if (latitude != null && longitude != null) {
            val latDelta = 0.045
            val lngDelta = 0.045
            val viewbox = "${longitude - lngDelta},${latitude - latDelta},${longitude + lngDelta},${latitude + latDelta}"
            params.add("viewbox=$viewbox")
            params.add("bounded=1")
        }

        return "$searchUrl?${params.joinToString("&")}"
    }
}
