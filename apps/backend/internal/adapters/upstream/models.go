package upstream

type osrmResponse struct {
	Code   string      `json:"code"`
	Routes []osrmRoute `json:"routes"`
}

type osrmRoute struct {
	Geometry osrmGeometry `json:"geometry"`
}

type osrmGeometry struct {
	Type        string      `json:"type"`
	Coordinates [][]float64 `json:"coordinates"`
}

type nominatimPlace struct {
	Name      string  `json:"display_name"`
	Latitude  float64 `json:"lat,string"`
	Longitude float64 `json:"lon,string"`
}
