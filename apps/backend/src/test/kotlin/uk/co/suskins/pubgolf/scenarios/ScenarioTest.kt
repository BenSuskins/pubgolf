package uk.co.suskins.pubgolf.scenarios

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.SerializationFeature
import dev.forkhandles.result4k.Result
import dev.forkhandles.result4k.resultFrom
import dev.forkhandles.result4k.valueOrNull
import org.json.JSONObject
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.test.context.ActiveProfiles
import org.springframework.web.client.RestClient

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT)
@ActiveProfiles("test")
abstract class ScenarioTest {
    private val restClient = RestClient.create()

    val uuidPattern = Regex("[a-f0-9\\-]{36}", RegexOption.IGNORE_CASE)
    val gameCodePattern = Regex("[A-Z]+\\d{3}")
    val resultPattern =
        Regex("^(Double Drink|Half Score|Double Score|Free Choice|Tequila|Beer|Wine|Cider|Cocktail|Spirit w/ Mixer|Guinness|Jägerbomb|VK)\$")

    fun createGame(host: String?) = resultFrom {
        restClient.post()
            .uri("http://localhost:8080/api/v1/games")
            .contentType(MediaType.APPLICATION_JSON)
            .body(host?.let { """{ "host": "$host"}""" } ?: "")
            .retrieve()
            .toEntity(String::class.java)
    }

    fun joinGame(gameCode: String?, name: String?) = resultFrom {
        restClient.post()
            .uri("http://localhost:8080/api/v1/games/${gameCode}/join")
            .contentType(MediaType.APPLICATION_JSON)
            .body(name?.let { """{ "name": "$name"}""" } ?: "")
            .retrieve()
            .toEntity(String::class.java)
    }

    fun gameState(gameCode: String?) = resultFrom {
        restClient.get()
            .uri("http://localhost:8080/api/v1/games/${gameCode}")
            .retrieve()
            .toEntity(String::class.java)
    }

    fun imFeelingLucky(gameCode: String?, playerId: String?) = resultFrom {
        restClient.post()
            .uri("http://localhost:8080/api/v1/games/$gameCode/players/$playerId/lucky")
            .contentType(MediaType.APPLICATION_JSON)
            .retrieve()
            .toEntity(String::class.java)
    }

    fun wheelOptions() = resultFrom {
        restClient.get()
            .uri("http://localhost:8080/api/v1/games/wheel-options")
            .retrieve()
            .toEntity(String::class.java)
    }

    fun submitScore(gameCode: String?, playerId: String?, hole: Int, score: Int) = resultFrom {
        restClient.post()
            .uri("http://localhost:8080/api/v1/games/$gameCode/players/$playerId/scores")
            .contentType(MediaType.APPLICATION_JSON)
            .body("""{"hole": $hole,"score": $score}""")
            .retrieve()
            .toEntity(String::class.java)
    }

    fun gameOfTenPlayers(host: String): Result<ResponseEntity<String>, Exception> {
        val game = createGame(host)
        for (i in 1..9) {
            joinGame(game.gameCode(), "$host$i")
        }
        return game
    }

    fun Result<ResponseEntity<String>, Exception>.bodyString() =
        valueOrNull()!!.body as String

    fun Result<ResponseEntity<String>, Exception>.gameCode() =
        JSONObject(bodyString()).getString("gameCode")!!

    fun Result<ResponseEntity<String>, Exception>.playerId() =
        JSONObject(bodyString()).getString("playerId")!!

    fun String.asJsonMap(): Map<String, Any> =
        ObjectMapper().readValue(this, object : TypeReference<Map<String, Any>>() {})
}

fun String?.asPrettyJson(): String {
    val mapper = ObjectMapper().enable(SerializationFeature.INDENT_OUTPUT)
    return mapper.writeValueAsString(mapper.readTree(this))
}