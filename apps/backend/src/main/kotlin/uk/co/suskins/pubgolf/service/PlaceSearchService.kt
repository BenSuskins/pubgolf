package uk.co.suskins.pubgolf.service

import dev.forkhandles.result4k.Result
import uk.co.suskins.pubgolf.models.PlaceSearchResult
import uk.co.suskins.pubgolf.models.PubGolfFailure

interface PlaceSearchService {
    fun search(
        query: String,
        clientIdentifier: String,
        latitude: Double? = null,
        longitude: Double? = null,
    ): Result<List<PlaceSearchResult>, PubGolfFailure>
}
