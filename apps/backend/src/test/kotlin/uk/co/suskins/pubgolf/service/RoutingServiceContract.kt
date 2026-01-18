package uk.co.suskins.pubgolf.service

import com.natpryce.hamkrest.assertion.assertThat
import com.natpryce.hamkrest.equalTo
import dev.forkhandles.result4k.Success
import dev.forkhandles.result4k.valueOrNull
import org.junit.jupiter.api.Tag
import uk.co.suskins.pubgolf.adapter.routing.OsrmRoutingAdapter
import uk.co.suskins.pubgolf.models.GameId
import uk.co.suskins.pubgolf.models.Hole
import uk.co.suskins.pubgolf.models.Pub
import uk.co.suskins.pubgolf.models.PubId
import kotlin.test.Test
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

interface RoutingServiceContract {
    val routingService: RoutingService

    @Test
    fun `returns null when given empty list of pubs`() {
        val result = routingService.calculateRoute(emptyList())
        assertThat(result, equalTo(Success(null)))
    }

    @Test
    fun `returns route geometry for valid list of pubs`() {
        val pubs =
            listOf(
                Pub(
                    id = PubId.random(),
                    gameId = GameId.random(),
                    hole = Hole(1),
                    name = "The Red Lion",
                    latitude = 51.5074,
                    longitude = -0.1278,
                ),
                Pub(
                    id = PubId.random(),
                    gameId = GameId.random(),
                    hole = Hole(2),
                    name = "The White Hart",
                    latitude = 51.5085,
                    longitude = -0.1257,
                ),
            )

        val result = routingService.calculateRoute(pubs).valueOrNull()
        assertNotNull(result)
        assertThat(result!!.type, equalTo("LineString"))
        assertTrue(result.coordinates.isNotEmpty())
    }

    @Test
    fun `sorts pubs by hole number before calculating route`() {
        val pubs =
            listOf(
                Pub(
                    id = PubId.random(),
                    gameId = GameId.random(),
                    hole = Hole(2),
                    name = "Second Pub",
                    latitude = 51.5085,
                    longitude = -0.1257,
                ),
                Pub(
                    id = PubId.random(),
                    gameId = GameId.random(),
                    hole = Hole(1),
                    name = "First Pub",
                    latitude = 51.5074,
                    longitude = -0.1278,
                ),
            )

        val result = routingService.calculateRoute(pubs).valueOrNull()
        assertNotNull(result)
    }

    @Test
    fun `handles single pub gracefully`() {
        val pubs =
            listOf(
                Pub(
                    id = PubId.random(),
                    gameId = GameId.random(),
                    hole = Hole(1),
                    name = "The Only Pub",
                    latitude = 51.5074,
                    longitude = -0.1278,
                ),
            )

        val result = routingService.calculateRoute(pubs)
        val value = result.valueOrNull()
        assertNull(value)
    }
}

class RoutingServiceFakeTest : RoutingServiceContract {
    override val routingService = RoutingServiceFake()
}

@Tag("integration")
class OsrmRoutingAdapterTest : RoutingServiceContract {
    override val routingService =
        OsrmRoutingAdapter(
            baseUrl = "https://router.project-osrm.org",
            profile = "foot",
        )
}
