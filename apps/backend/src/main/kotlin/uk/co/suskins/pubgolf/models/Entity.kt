package uk.co.suskins.pubgolf.models

import jakarta.persistence.*
import java.io.Serializable
import java.time.Instant
import java.util.*

@Entity
@Table(name = "games")
data class GameEntity(
    @Id
    val id: UUID,
    val code: String,
    @OneToMany(cascade = [CascadeType.ALL], orphanRemoval = true, fetch = FetchType.EAGER)
    @JoinColumn(name = "game_id")
    val players: MutableList<PlayerEntity> = mutableListOf()
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
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "scores", joinColumns = [JoinColumn(name = "player_id")])
    @MapKeyColumn(name = "hole")
    @Column(name = "score")
    val scores: MutableMap<Int, Int> = mutableMapOf(),
    @OneToOne(mappedBy = "player", cascade = [CascadeType.ALL], fetch = FetchType.LAZY)
    var lucky: PlayerLuckyEntity? = null
)

@Embeddable
data class PlayerLuckyId(
    val gameId: UUID = UUID.randomUUID(),
    val playerId: UUID = UUID.randomUUID()
) : Serializable

@Entity
@Table(name = "player_lucky")
data class PlayerLuckyEntity(
    @EmbeddedId
    val id: PlayerLuckyId,

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
    val created: Instant = Instant.now()
)

fun GameEntity.toDomain(): Game = Game(
    id = GameId(id),
    code = GameCode(code),
    players = players.map {
        Player(
            id = PlayerId(it.id),
            name = PlayerName(it.name),
            lucky = it.lucky?.let { luckyEntity ->
                Lucky(
                    hole = Hole(luckyEntity.hole),
                    result = Outcomes.valueOf(luckyEntity.outcome)
                )
            },
            scores = it.scores.mapKeys { Hole(it.key) }.mapValues { Score(it.value) })

    }
)