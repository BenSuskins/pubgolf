package uk.co.suskins.pubgolf.config

import org.junit.jupiter.api.Test
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.HttpHeaders
import org.springframework.test.context.ActiveProfiles
import org.springframework.web.client.RestClient
import kotlin.test.assertTrue

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT)
@ActiveProfiles("test")
class CorsConfigTest {
    private val restClient = RestClient.create()

    @Test
    fun `CORS preflight should allow PATCH method`() {
        val response =
            restClient
                .options()
                .uri("http://localhost:8080/api/v1/games/TEST123")
                .header(HttpHeaders.ORIGIN, "http://localhost:3000")
                .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "PATCH")
                .retrieve()
                .toBodilessEntity()

        val allowedMethods = response.headers.getFirst(HttpHeaders.ACCESS_CONTROL_ALLOW_METHODS)
        assertTrue(
            allowedMethods?.contains("PATCH") == true,
            "CORS should allow PATCH method, but got: $allowedMethods",
        )
    }

    @Test
    fun `CORS preflight should allow PUT method`() {
        val response =
            restClient
                .options()
                .uri("http://localhost:8080/api/v1/games/TEST123/active-event")
                .header(HttpHeaders.ORIGIN, "http://localhost:3000")
                .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "PUT")
                .retrieve()
                .toBodilessEntity()

        val allowedMethods = response.headers.getFirst(HttpHeaders.ACCESS_CONTROL_ALLOW_METHODS)
        assertTrue(
            allowedMethods?.contains("PUT") == true,
            "CORS should allow PUT method, but got: $allowedMethods",
        )
    }

    @Test
    fun `CORS preflight should allow DELETE method`() {
        val response =
            restClient
                .options()
                .uri("http://localhost:8080/api/v1/games/TEST123/active-event")
                .header(HttpHeaders.ORIGIN, "http://localhost:3000")
                .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "DELETE")
                .retrieve()
                .toBodilessEntity()

        val allowedMethods = response.headers.getFirst(HttpHeaders.ACCESS_CONTROL_ALLOW_METHODS)
        assertTrue(
            allowedMethods?.contains("DELETE") == true,
            "CORS should allow DELETE method, but got: $allowedMethods",
        )
    }

    @Test
    fun `CORS preflight should still allow GET method`() {
        val response =
            restClient
                .options()
                .uri("http://localhost:8080/api/v1/games/TEST123")
                .header(HttpHeaders.ORIGIN, "http://localhost:3000")
                .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET")
                .retrieve()
                .toBodilessEntity()

        val allowedMethods = response.headers.getFirst(HttpHeaders.ACCESS_CONTROL_ALLOW_METHODS)
        assertTrue(
            allowedMethods?.contains("GET") == true,
            "CORS should allow GET method, but got: $allowedMethods",
        )
    }

    @Test
    fun `CORS preflight should still allow POST method`() {
        val response =
            restClient
                .options()
                .uri("http://localhost:8080/api/v1/games")
                .header(HttpHeaders.ORIGIN, "http://localhost:3000")
                .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST")
                .retrieve()
                .toBodilessEntity()

        val allowedMethods = response.headers.getFirst(HttpHeaders.ACCESS_CONTROL_ALLOW_METHODS)
        assertTrue(
            allowedMethods?.contains("POST") == true,
            "CORS should allow POST method, but got: $allowedMethods",
        )
    }
}
