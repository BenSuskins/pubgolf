package co.uk.suskins.pubgolf.models;

import javax.persistence.Entity;
import javax.persistence.Id;

/**
 * Class to represent a game of Pubgolf for a User
 */
@Entity
public class Pubgolf implements Comparable<Pubgolf> {
    @Id
    private String name;
    private Integer hole_1;
    private Integer hole_2;
    private Integer hole_3;
    private Integer hole_4;
    private Integer hole_5;
    private Integer hole_6;
    private Integer hole_7;
    private Integer hole_8;
    private Integer hole_9;
    private Integer score;

    public Pubgolf() {
    }

    public Pubgolf(String name, int hole_1,
                   int hole_2, int hole_3,
                   int hole_4, int hole_5,
                   int hole_6, int hole_7,
                   int hole_8, int hole_9) {
        this.name = name;
        this.hole_1 = hole_1;
        this.hole_2 = hole_2;
        this.hole_3 = hole_3;
        this.hole_4 = hole_4;
        this.hole_5 = hole_5;
        this.hole_6 = hole_6;
        this.hole_7 = hole_7;
        this.hole_8 = hole_8;
        this.hole_9 = hole_9;
        this.score = hole_1 + hole_2 + hole_3 + hole_4 + hole_5 + hole_6 + hole_7 + hole_8 + hole_9;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getHole_1() {
        return hole_1;
    }

    public void setHole_1(Integer hole_1) {
        this.hole_1 = hole_1;
    }

    public Integer getHole_2() {
        return hole_2;
    }

    public void setHole_2(Integer hole_2) {
        this.hole_2 = hole_2;
    }

    public Integer getHole_3() {
        return hole_3;
    }

    public void setHole_3(Integer hole_3) {
        this.hole_3 = hole_3;
    }

    public Integer getHole_4() {
        return hole_4;
    }

    public void setHole_4(Integer hole_4) {
        this.hole_4 = hole_4;
    }

    public Integer getHole_5() {
        return hole_5;
    }

    public void setHole_5(Integer hole_5) {
        this.hole_5 = hole_5;
    }

    public Integer getHole_6() {
        return hole_6;
    }

    public void setHole_6(Integer hole_6) {
        this.hole_6 = hole_6;
    }

    public Integer getHole_7() {
        return hole_7;
    }

    public void setHole_7(Integer hole_7) {
        this.hole_7 = hole_7;
    }

    public Integer getHole_8() {
        return hole_8;
    }

    public void setHole_8(Integer hole_8) {
        this.hole_8 = hole_8;
    }

    public Integer getHole_9() {
        return hole_9;
    }

    public void setHole_9(Integer hole_9) {
        this.hole_9 = hole_9;
    }

    public Integer getScore() {
        return score;
    }

    public void setScore(Integer score) {
        this.score = score;
    }

    public void updateScore() {
        setScore(hole_1 + hole_2 + hole_3 + hole_4 + hole_5 + hole_6 + hole_7 + hole_8 + hole_9);
    }

    @Override
    public int compareTo(Pubgolf o) {
        return this.getScore().compareTo(o.getScore());
    }
}
