package co.uk.suskins.pubgolf.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class JspController {
    @RequestMapping("/score")
    public String score(Model model,
                        @RequestParam(value = "name", required = false, defaultValue = "Score") String name) {
        model.addAttribute("name", name);
        return "score";
    }
}
