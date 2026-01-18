package uk.co.suskins.pubgolf.service

import dev.forkhandles.result4k.Result
import dev.forkhandles.result4k.Success
import uk.co.suskins.pubgolf.models.PlaceSearchResult
import uk.co.suskins.pubgolf.models.PubGolfFailure

class PlaceSearchServiceFake : PlaceSearchService {
    override fun search(
        query: String,
        clientIdentifier: String,
        latitude: Double?,
        longitude: Double?,
    ): Result<List<PlaceSearchResult>, PubGolfFailure> {
        val baseLatitude = latitude ?: 51.5074
        val baseLongitude = longitude ?: -0.1278

        val results =
            (1..5).map { index ->
                PlaceSearchResult(
                    name = "Test $query $index",
                    latitude = baseLatitude + (index * 0.001),
                    longitude = baseLongitude + (index * 0.001),
                )
            }

        return Success(results)
    }
}
