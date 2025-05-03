package uk.co.suskins.pubgolf

import org.approvaltests.Approvals
import org.junit.jupiter.api.Test
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.web.client.RestTemplate

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT)
class OpenApiTest {
    @Test
    fun `Can generate an open api spec`() {
        Approvals.verify(openApiDocs())
    }

    private fun openApiDocs(): String? {
        val restTemplate = RestTemplate()
        return restTemplate.getForObject("http://localhost:8080/v3/api-docs", String::class.java)
    }
}