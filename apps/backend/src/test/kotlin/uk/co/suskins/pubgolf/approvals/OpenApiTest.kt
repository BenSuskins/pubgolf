package uk.co.suskins.pubgolf.approvals

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.SerializationFeature
import com.oneeyedmen.okeydoke.Approver
import com.oneeyedmen.okeydoke.junit5.ApprovalsExtension
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.RegisterExtension
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.web.client.RestTemplate


@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT)
class OpenApiTest {
    @RegisterExtension
    var approvals: ApprovalsExtension = ApprovalsExtension()

    @Test
    fun `Can generate an open api spec`(approver: Approver) {
        approver.assertApproved(openApiDocs().asPrettyJson())
    }

    private fun openApiDocs(): String? {
        val restTemplate = RestTemplate()
        return restTemplate.getForObject("http://localhost:8080/v3/api-docs", String::class.java)
    }
}

private fun String?.asPrettyJson(): String {
    if (this.isNullOrBlank()) return "<empty or null JSON>"

    return try {
        val mapper = ObjectMapper().enable(SerializationFeature.INDENT_OUTPUT)
        val jsonNode = mapper.readTree(this)
        mapper.writeValueAsString(jsonNode)
    } catch (e: Exception) {
        "<invalid JSON>\n$this"
    }
}