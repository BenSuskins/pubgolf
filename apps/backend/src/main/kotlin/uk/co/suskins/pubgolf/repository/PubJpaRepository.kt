package uk.co.suskins.pubgolf.repository

import org.springframework.data.jpa.repository.JpaRepository
import uk.co.suskins.pubgolf.models.PubEntity
import uk.co.suskins.pubgolf.models.PubEntityId
import java.util.UUID

interface PubJpaRepository : JpaRepository<PubEntity, PubEntityId> {
    @Suppress("ktlint:standard:function-naming")
    fun findByGame_IdOrderByIdHoleAsc(gameId: UUID): List<PubEntity>
}
