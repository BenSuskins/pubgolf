package co.uk.suskins.pubgolf.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * Controller for accessing the score jsp page.
 */
@Controller
public class JspController {
    /**
     * Returns the Score JSP page.
     *
     * @param model Model (??)
     * @return Score JSP Page
     */
    @RequestMapping("/score")
    public String score(Model model) {
        return "score";
    }
}
