package uk.co.suskins.pubgolf.models

import jakarta.persistence.*
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
)

fun GameEntity.toDomain(): Game = Game(
    id = GameId(id),
    code = GameCode(code),
    players = players.map {
        Player(
            id = PlayerId(it.id),
            name = PlayerName(it.name),
            scores = it.scores.mapKeys { Hole(it.key) }.mapValues { Score(it.value) })
    }
)