package osrm

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
