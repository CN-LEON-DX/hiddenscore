package interfaces

type ProductFilter struct {
	Name        string  `json:"name"`
	Description string  `json:"description"`
	MinPrice    float64 `json:"min_price"`
	MaxPrice    float64 `json:"max_price"`
}
