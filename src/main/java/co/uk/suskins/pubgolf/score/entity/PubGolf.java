package co.uk.suskins.pubgolf.score.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.Entity;
import javax.persistence.Id;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
public class PubGolf implements Comparable<PubGolf> {
    @Id
    private String name;
    @JsonProperty("hole_one")
    private int holeOne;
    @JsonProperty("hole_two")
    private int holeTwo;
    @JsonProperty("hole_three")
    private int holeThree;
    @JsonProperty("hole_four")
    private int holeFour;
    @JsonProperty("hole_five")
    private int holeFive;
    @JsonProperty("hole_six")
    private int holeSix;
    @JsonProperty("hole_seven")
    private int holeSeven;
    @JsonProperty("hole_eight")
    private int holeEight;
    @JsonProperty("hole_nine")
    private int holeNine;
    private Integer score;

    @Override
    public int compareTo(final PubGolf o) {
        return score.compareTo(o.getScore());
    }

    public void updateScore() {
        this.score = holeOne + holeTwo + holeThree + holeFour + holeFive + holeSix + holeSeven + holeEight + holeNine;
    }
}
