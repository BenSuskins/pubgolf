package co.uk.suskins.pubgolf.config;

import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

/**
 * Configuration class for beans.
 */
@Configuration
@ComponentScan(basePackages = {"co.uk.suskins.pubgolf"})
@EntityScan(basePackages = {"co.uk.suskins.pubgolf"})
@EnableJpaRepositories(basePackages = {"co.uk.suskins.pubgolf.repository"})
@EnableAutoConfiguration
public class Config {
}
