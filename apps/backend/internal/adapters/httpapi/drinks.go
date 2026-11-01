package httpapi

import (
	"bytes"
	"encoding/json"
	"fmt"

	"github.com/BenSuskins/pubgolf/backend/internal/domain"
)

type drinks []domain.Drink

func (values drinks) MarshalJSON() ([]byte, error) {
	var buffer bytes.Buffer
	buffer.WriteByte('{')
	for index, value := range values {
		if index > 0 {
			buffer.WriteByte(',')
		}
		key, _ := json.Marshal(value.Route)
		name, _ := json.Marshal(value.Name)
		buffer.Write(key)
		buffer.WriteByte(':')
		buffer.Write(name)
	}
	buffer.WriteByte('}')
	return buffer.Bytes(), nil
}

func (values *drinks) UnmarshalJSON(data []byte) error {
	decoder := json.NewDecoder(bytes.NewReader(data))
	token, err := decoder.Token()
	if err != nil || token != json.Delim('{') {
		return fmt.Errorf("drinks must be an object")
	}
	for decoder.More() {
		key, err := decoder.Token()
		if err != nil {
			return err
		}
		var name string
		if err = decoder.Decode(&name); err != nil {
			return err
		}
		*values = append(*values, domain.Drink{Route: key.(string), Name: name})
	}
	_, err = decoder.Token()
	return err
}
