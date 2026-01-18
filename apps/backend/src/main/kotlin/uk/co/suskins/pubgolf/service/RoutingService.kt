package uk.co.suskins.pubgolf.service

import dev.forkhandles.result4k.Result
import uk.co.suskins.pubgolf.models.Pub
import uk.co.suskins.pubgolf.models.PubGolfFailure
import uk.co.suskins.pubgolf.models.RouteGeometry

interface RoutingService {
    fun calculateRoute(pubs: List<Pub>): Result<RouteGeometry?, PubGolfFailure>
}
