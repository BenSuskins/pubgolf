package uk.co.suskins.pubgolf.models

import jakarta.persistence.CascadeType
import jakarta.persistence.Column
import jakarta.persistence.Embeddable
import jakarta.persistence.EmbeddedId
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.MapsId
import jakarta.persistence.OneToMany
import jakarta.persistence.OneToOne
import jakarta.persistence.Table
import java.io.Serializable
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "games")
data class GameEntity(
    @Id
    val id: UUID,
    val code: String,
    @OneToMany(cascade = [CascadeType.ALL], orphanRemoval = true, fetch = FetchType.EAGER)
    @JoinColumn(name = "game_id")
    val players: MutableList<PlayerEntity> = mutableListOf(),
) {
    fun addPlayer(playerEntity: PlayerEntity) {
        this.players.add(playerEntity)
    }
}

@Entity
@Table(name = "players")
data class PlayerEntity(
    @Id
    val id: UUID,
    val name: String,
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_id", nullable = false)
    var game: GameEntity,
    @OneToMany(mappedBy = "player", cascade = [CascadeType.ALL], orphanRemoval = true, fetch = FetchType.EAGER)
    val scores: MutableList<ScoreEntity> = mutableListOf(),
    @OneToOne(mappedBy = "player", cascade = [CascadeType.ALL], fetch = FetchType.LAZY)
    var randomise: PlayerRandomiseEntity? = null,
)

@Embeddable
data class PlayerRandomiseId(
    val gameId: UUID = UUID.randomUUID(),
    val playerId: UUID = UUID.randomUUID(),
) : Serializable

@Entity
@Table(name = "player_lucky")
data class PlayerRandomiseEntity(
    @EmbeddedId
    val id: PlayerRandomiseId,
    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("gameId")
    @JoinColumn(name = "game_id", nullable = false)
    val game: GameEntity,
    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("playerId")
    @JoinColumn(name = "player_id", nullable = false)
    val player: PlayerEntity,
    @Column(name = "hole", nullable = false)
    val hole: Int,
    @Column(name = "outcome", nullable = false)
    val outcome: String,
    @Column(name = "created", nullable = false)
    val created: Instant = Instant.now(),
)

@Entity
@Table(name = "scores")
data class ScoreEntity(
    @EmbeddedId
    val id: ScoreId,
    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("playerId")
    @JoinColumn(name = "player_id")
    val player: PlayerEntity,
    @Column(name = "score", nullable = false)
    val score: Int,
    @Column(name = "modified", nullable = false)
    var modified: Instant,
)

@Embeddable
data class ScoreId(
    @Column(name = "player_id")
    val playerId: UUID,
    @Column(name = "hole")
    val hole: Int,
) : Serializable

fun GameEntity.toDomain(): Game =
    Game(
        id = GameId(id),
        code = GameCode(code),
        players =
            players.map {
                Player(
                    id = PlayerId(it.id),
                    name = PlayerName(it.name),
                    randomise =
                        it.randomise?.let { randomiseEntity ->
                            Randomise(
                                hole = Hole(randomiseEntity.hole),
                                result = Outcomes.valueOf(randomiseEntity.outcome),
                            )
                        },
                    scores =
                        it.scores
                            .sortedBy { it.id.hole }
                            .associateTo(LinkedHashMap()) {
                                Hole(it.id.hole) to
                                    ScoreWithTimestamp(
                                        Score(it.score),
                                        it.modified,
                                    )
                            },
                )
            },
    )
