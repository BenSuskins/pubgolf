package co.uk.suskins.pubgolf;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.oauth2.client.EnableOAuth2Sso;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@SpringBootApplication
@EnableOAuth2Sso
@RestController
public class PubgolfApplication {
    @RequestMapping("/user")
    public Principal user(Principal principal) {
        return principal;
    }

    @PostMapping("/submitscore")
    public void submit(@RequestParam("name") String name, @RequestParam("hole") String hole, @RequestParam("par") int par) {
        System.out.println(name);
    }

    public static void main(String[] args) {
        SpringApplication.run(PubgolfApplication.class, args);
    }

}
