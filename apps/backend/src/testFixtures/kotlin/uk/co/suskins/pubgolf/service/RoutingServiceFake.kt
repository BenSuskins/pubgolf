package uk.co.suskins.pubgolf.service

import dev.forkhandles.result4k.Result
import dev.forkhandles.result4k.Success
import uk.co.suskins.pubgolf.models.Pub
import uk.co.suskins.pubgolf.models.PubGolfFailure
import uk.co.suskins.pubgolf.models.RouteGeometry

class RoutingServiceFake : RoutingService {
    override fun calculateRoute(pubs: List<Pub>): Result<RouteGeometry?, PubGolfFailure> {
        if (pubs.size < 2) {
            return Success(null)
        }

        val coordinates =
            pubs
                .sortedBy { it.hole.value }
                .map { listOf(it.longitude, it.latitude) }

        return Success(
            RouteGeometry(
                type = "LineString",
                coordinates = coordinates,
            ),
        )
    }
}
