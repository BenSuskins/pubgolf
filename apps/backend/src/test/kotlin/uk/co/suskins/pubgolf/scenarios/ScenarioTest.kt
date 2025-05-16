package uk.co.suskins.pubgolf.scenarios

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.SerializationFeature
import dev.forkhandles.result4k.Result
import dev.forkhandles.result4k.resultFrom
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.client.RestClient

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT)
abstract class ScenarioTest {
    private val restClient = RestClient.create()

    fun createGame(host: String?): Result<ResponseEntity<String>, Exception> {
        return resultFrom {
            restClient.post()
                .uri("http://localhost:8080/api/v1/games")
                .contentType(MediaType.APPLICATION_JSON)
                .body(host?.let { """{ "host": "$host"}""" } ?: "")
                .retrieve()
                .toEntity(String::class.java)
        }
    }
}

fun String?.asPrettyJson(): String {
    val mapper = ObjectMapper().enable(SerializationFeature.INDENT_OUTPUT)
    return mapper.writeValueAsString(mapper.readTree(this))
}