package co.uk.suskins.pubgolf;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class ScoreController {
    @Autowired
    private PubgolfRepository pubgolfRepository;


    @RequestMapping("/score")
    public String score(Model model,
                        @RequestParam(value = "name", required = false, defaultValue = "Score") String name) {
        model.addAttribute("name", name);
        return "score";
    }

    @RequestMapping("/")
    public String score(Model model) {
        model.addAttribute("users", pubgolfRepository.findAll());
        return "index";
    }
}
