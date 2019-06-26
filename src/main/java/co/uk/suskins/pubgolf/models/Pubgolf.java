package co.uk.suskins.pubgolf.models;

import javax.persistence.Entity;
import javax.persistence.Id;

@Entity
public class Pubgolf {
    @Id
    private String name;
    private int hole_1;
    private int hole_2;
    private int hole_3;
    private int hole_4;
    private int hole_5;
    private int hole_6;
    private int hole_7;
    private int hole_8;
    private int hole_9;
    private int score;

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

    public int getHole_1() {
        return hole_1;
    }

    public void setHole_1(int hole_1) {
        this.hole_1 = hole_1;
    }

    public int getHole_2() {
        return hole_2;
    }

    public void setHole_2(int hole_2) {
        this.hole_2 = hole_2;
    }

    public int getHole_3() {
        return hole_3;
    }

    public void setHole_3(int hole_3) {
        this.hole_3 = hole_3;
    }

    public int getHole_4() {
        return hole_4;
    }

    public void setHole_4(int hole_4) {
        this.hole_4 = hole_4;
    }

    public int getHole_5() {
        return hole_5;
    }

    public void setHole_5(int hole_5) {
        this.hole_5 = hole_5;
    }

    public int getHole_6() {
        return hole_6;
    }

    public void setHole_6(int hole_6) {
        this.hole_6 = hole_6;
    }

    public int getHole_7() {
        return hole_7;
    }

    public void setHole_7(int hole_7) {
        this.hole_7 = hole_7;
    }

    public int getHole_8() {
        return hole_8;
    }

    public void setHole_8(int hole_8) {
        this.hole_8 = hole_8;
    }

    public int getHole_9() {
        return hole_9;
    }

    public void setHole_9(int hole_9) {
        this.hole_9 = hole_9;
    }

    public int getScore() {
        return score;
    }

    public void setScore(int score) {
        this.score = score;
    }

    public void updateScore() {
        this.score = hole_1 + hole_2 + hole_3 + hole_4 + hole_5 + hole_6 + hole_7 + hole_8 + hole_9;
    }
}
