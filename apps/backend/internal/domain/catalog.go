package domain

type Outcome struct {
	Label  string
	Weight int
}

func Outcomes() []Outcome {
	return []Outcome{
		{"Double Drink", 4},
		{"Half Score", 2},
		{"Double Score", 3},
		{"Free Choice", 1},
		{"Tequila", 5},
		{"Beer", 5},
		{"Wine", 5},
		{"Cider", 5},
		{"Cocktail", 5},
		{"Spirit w/ Mixer", 5},
		{"Guinness", 5},
		{"Jägerbomb", 5},
		{"VK", 5},
	}
}

type GameEvent struct{ ID, Title, Description string }

func AvailableEvents() []GameEvent {
	return []GameEvent{
		{"photo-op", "Photo Op!", "Everyone must take a group photo at the current venue"},
		{"speed-round", "Speed Round", "Finish your current drink within 2 minutes"},
		{"halftime", "Halftime", "Take a 5-minute break"},
		{"last-orders", "Last Orders", "Final warning before moving to next venue"},
		{"club-swap", "Club Swap", "You must drink with your non-dominant hand, getting caught is a +1 penalty"},
		{"stranger-danger", "Stranger Danger", "Convince a stranger to buy you a drink, -2 points"},
	}
}

func DefaultCourse() []CourseHole {
	return []CourseHole{
		{1, 1, []Drink{{"Route A", "Tequila"}, {"Route B", "Sambuca"}}},
		{2, 3, []Drink{{"Route A", "Beer"}, {"Route B", "Double Vodka & Single Vodka w/ Mixer"}}},
		{3, 2, []Drink{{"Route A", "Wine"}, {"Route B", "Double Gin w/ Mixer"}}},
		{4, 2, []Drink{{"Route A", "Cider"}, {"Route B", "Double Rum w/ Mixer"}}},
		{5, 2, []Drink{{"Route A", "Cocktail"}, {"Route B", "Cocktail"}}},
		{6, 2, []Drink{{"Route A", "Spirit w/ Mixer"}, {"Route B", "Spirit w/ Mixer"}}},
		{7, 4, []Drink{{"Route A", "Guinness"}, {"Route B", "2 x Double Whiskey w/ Mixer"}}},
		{8, 1, []Drink{{"Route A", "Jägerbomb"}, {"Route B", "Jägerbomb"}}},
		{9, 1, []Drink{{"Route A", "VK"}, {"Route B", "Smirnoff Ice"}}},
	}
}
