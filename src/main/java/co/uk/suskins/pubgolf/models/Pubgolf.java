package co.uk.suskins.pubgolf.models;

import javax.persistence.Entity;
import javax.persistence.Id;

/**
 * Entity which represents a users game of Pubgolf.
 */
@Entity
public class Pubgolf implements Comparable<Pubgolf> {
    @Id
    private String name;
    private Integer hole1;
    private Integer hole2;
    private Integer hole3;
    private Integer hole4;
    private Integer hole5;
    private Integer hole6;
    private Integer hole7;
    private Integer hole8;
    private Integer hole9;
    private Integer score;

    public Pubgolf() {
    }

    public Pubgolf(String name, int hole1,
                   int hole2, int hole3,
                   int hole4, int hole5,
                   int hole6, int hole7,
                   int hole8, int hole9) {
        this.name = name;
        this.hole1 = hole1;
        this.hole2 = hole2;
        this.hole3 = hole3;
        this.hole4 = hole4;
        this.hole5 = hole5;
        this.hole6 = hole6;
        this.hole7 = hole7;
        this.hole8 = hole8;
        this.hole9 = hole9;
        this.score = hole1 + hole2 + hole3 + hole4 + hole5 + hole6 + hole7 + hole8 + hole9;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getHole1() {
        return hole1;
    }

    public void setHole1(Integer hole1) {
        this.hole1 = hole1;
    }

    public Integer getHole2() {
        return hole2;
    }

    public void setHole2(Integer hole2) {
        this.hole2 = hole2;
    }

    public Integer getHole3() {
        return hole3;
    }

    public void setHole3(Integer hole3) {
        this.hole3 = hole3;
    }

    public Integer getHole4() {
        return hole4;
    }

    public void setHole4(Integer hole4) {
        this.hole4 = hole4;
    }

    public Integer getHole5() {
        return hole5;
    }

    public void setHole5(Integer hole5) {
        this.hole5 = hole5;
    }

    public Integer getHole6() {
        return hole6;
    }

    public void setHole6(Integer hole6) {
        this.hole6 = hole6;
    }

    public Integer getHole7() {
        return hole7;
    }

    public void setHole7(Integer hole7) {
        this.hole7 = hole7;
    }

    public Integer getHole8() {
        return hole8;
    }

    public void setHole8(Integer hole8) {
        this.hole8 = hole8;
    }

    public Integer getHole9() {
        return hole9;
    }

    public void setHole9(Integer hole9) {
        this.hole9 = hole9;
    }

    public Integer getScore() {
        return score;
    }

    public void setScore(Integer score) {
        this.score = score;
    }

    public void updateScore() {
        setScore(hole1 + hole2 + hole3 + hole4 + hole5 + hole6 + hole7 + hole8 + hole9);
    }

    @Override
    public int compareTo(Pubgolf o) {
        return this.getScore().compareTo(o.getScore());
    }
}
