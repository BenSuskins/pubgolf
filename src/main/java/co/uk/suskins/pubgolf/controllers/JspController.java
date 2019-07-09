package co.uk.suskins.pubgolf.controllers;

import co.uk.suskins.pubgolf.models.Pubgolf;
import co.uk.suskins.pubgolf.repository.PubgolfRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.Collections;
import java.util.List;

@Controller
public class JspController {
    @Autowired
    private PubgolfRepository pubgolfRepository;

    @RequestMapping("/")
    public String score(Model model) {
        List<Pubgolf> entities = (List<Pubgolf>) pubgolfRepository.findAll();
        Collections.sort(entities);
        model.addAttribute("users", entities);
        return "index";
    }

    @RequestMapping("/score")
    public String score(Model model,
                        @RequestParam(value = "name", required = false, defaultValue = "Score") String name) {
        model.addAttribute("name", name);
        return "score";
    }
}
