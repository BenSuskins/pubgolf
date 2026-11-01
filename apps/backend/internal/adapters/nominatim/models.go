package nominatim

type nominatimPlace struct {
	Name      string  `json:"display_name"`
	Latitude  float64 `json:"lat,string"`
	Longitude float64 `json:"lon,string"`
}
