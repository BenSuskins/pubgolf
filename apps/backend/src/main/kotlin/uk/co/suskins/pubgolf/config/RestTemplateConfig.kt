package uk.co.suskins.pubgolf.config

import org.springframework.boot.web.client.RestTemplateBuilder
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.web.client.RestTemplate
import java.time.Duration

@Configuration
class RestTemplateConfig {
    // Without timeouts a hung upstream (OSRM, Nominatim) blocks servlet threads
    // indefinitely; the frontend gives up at 15s, so fail well before that.
    @Bean
    fun restTemplate(builder: RestTemplateBuilder): RestTemplate =
        builder
            .connectTimeout(Duration.ofSeconds(3))
            .readTimeout(Duration.ofSeconds(10))
            .build()
}
