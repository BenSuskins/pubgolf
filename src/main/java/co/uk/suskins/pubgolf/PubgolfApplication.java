package co.uk.suskins.pubgolf;

import co.uk.suskins.pubgolf.config.SpringFoxConfig;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Import;

@SpringBootApplication
@Import({SpringFoxConfig.class})
public class PubgolfApplication {
	public static void main(String[] args) {
		SpringApplication.run(PubgolfApplication.class, args);
	}

}
