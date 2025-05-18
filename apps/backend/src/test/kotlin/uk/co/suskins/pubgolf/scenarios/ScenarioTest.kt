package uk.co.suskins.pubgolf.scenarios

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

    fun submitScore(gameCode: String?, playerId: String?, hole: Int, score: Int) = resultFrom {
        restClient.post()
            .uri("http://localhost:8080/api/v1/games/$gameCode/players/$playerId/scores")
            .contentType(MediaType.APPLICATION_JSON)
            .body("""{"hole": $hole,"score": $score}""")
            .retrieve()
            .toEntity(String::class.java)
    }

    fun Result<ResponseEntity<String>, Exception>.gameCode() =
        JSONObject(valueOrNull()!!.body).getString("gameCode")!!

    fun Result<ResponseEntity<String>, Exception>.playerId() =
        JSONObject(valueOrNull()!!.body).getString("playerId")!!
}

fun String?.asPrettyJson(): String {
    val mapper = ObjectMapper().enable(SerializationFeature.INDENT_OUTPUT)
    return mapper.writeValueAsString(mapper.readTree(this))
}