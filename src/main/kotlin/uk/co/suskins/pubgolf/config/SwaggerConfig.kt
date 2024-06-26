package uk.co.suskins.pubgolf.config

import io.swagger.v3.oas.models.OpenAPI
import io.swagger.v3.oas.models.info.Contact
import io.swagger.v3.oas.models.info.Info
import io.swagger.v3.oas.models.servers.Server
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.env.Environment

@Configuration
class SwaggerConfig(
    private val environment: Environment
) {
    @Value("\${application.server}")
    private lateinit var serverUrl: String

    @Bean
    fun configureSwagger(): OpenAPI {
        return OpenAPI()
            .info(
                Info().title("Pub Golf")
                    .version("1.0.0")
                    .contact(Contact().name("Ben Suskins").email("suskinsdevelopment@gmail.com"))
                    .description("API's to power Pub Golf Application")
            )
            .servers(listOf(Server().url(serverUrl)))
    }
}
