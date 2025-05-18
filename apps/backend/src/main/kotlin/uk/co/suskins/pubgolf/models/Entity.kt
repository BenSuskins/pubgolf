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
)

@Entity
@Table(name = "players")
data class PlayerEntity(
    @Id
    val id: UUID,
    val name: String,
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "scores", joinColumns = [JoinColumn(name = "player_id")])
    @MapKeyColumn(name = "hole")
    @Column(name = "score")
    val scores: MutableMap<Int, Int> = mutableMapOf()
)

fun GameEntity.toDomain(): Game = Game(
    id = id,
    code = code,
    players = players.map {
        Player(id = it.id, name = it.name, scores = it.scores)
    }
)