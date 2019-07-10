package co.uk.suskins.pubgolf.controllers;

import org.springframework.security.oauth2.provider.OAuth2Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

/**
 * Controller for accessing the User object to obtain the Users Name.
 */
@RestController
public class UserController {
    /**
     * Returns the Users Full Name from the supplied OAuth2 Principal.
     *
     * @param principal OAuth2 Principal
     * @return String Users Full Name
     */
    @GetMapping("/user")
    public String user(Principal principal) {
        OAuth2Authentication auth = (OAuth2Authentication) principal;
        String name = auth.getUserAuthentication().getDetails().toString().substring(6);
        name = name.substring(0, name.indexOf(','));
        return name;
    }
}
