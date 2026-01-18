package uk.co.suskins.pubgolf.service

import com.natpryce.hamkrest.assertion.assertThat
import com.natpryce.hamkrest.greaterThan
import dev.forkhandles.result4k.valueOrNull
import org.junit.jupiter.api.Tag
import org.springframework.web.client.RestTemplate
import uk.co.suskins.pubgolf.adapter.geocoding.NominatimPlaceSearchAdapter
import kotlin.test.Test
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

interface PlaceSearchServiceContract {
    val placeSearchService: PlaceSearchService

    @Test
    fun `can search for places by query`() {
        val result =
            placeSearchService
                .search("pub", "test-client")
                .valueOrNull()

        assertNotNull(result)
        assertTrue(result.isNotEmpty())
        val firstResult = result.first()
        assertTrue(firstResult.name.isNotBlank())
        assertThat(firstResult.latitude, greaterThan(-90.0))
        assertThat(firstResult.longitude, greaterThan(-180.0))
    }

    @Test
    fun `respects result limit`() {
        val result =
            placeSearchService
                .search("pub", "test-client-2")
                .valueOrNull()

        assertNotNull(result)
        assertTrue(result.size <= 5)
    }

    @Test
    fun `can search with location bias`() {
        val result =
            placeSearchService
                .search("pub", "test-client-3", latitude = 51.5074, longitude = -0.1278)
                .valueOrNull()

        assertNotNull(result)
    }
}

class PlaceSearchServiceFakeTest : PlaceSearchServiceContract {
    override val placeSearchService = PlaceSearchServiceFake()
}

@Tag("integration")
class NominatimPlaceSearchAdapterTest : PlaceSearchServiceContract {
    override val placeSearchService =
        NominatimPlaceSearchAdapter(
            baseUrl = "https://nominatim.openstreetmap.org",
            userAgent = "PubGolf/1.0",
            rateLimitDelayMs = 1000,
            resultLimit = 5,
            restTemplate = RestTemplate(),
        )
}
