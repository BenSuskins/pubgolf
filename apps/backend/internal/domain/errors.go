package domain

type FailureKind string

const (
	Invalid       FailureKind = "invalid"
	NotFound      FailureKind = "not-found"
	Forbidden     FailureKind = "forbidden"
	Conflict      FailureKind = "conflict"
	DuplicateCode FailureKind = "duplicate-code"
	StaleVersion  FailureKind = "stale-version"
	Unavailable   FailureKind = "unavailable"
)

type Failure struct {
	Kind    FailureKind
	Message string
}

func (failure *Failure) Error() string            { return failure.Message }
func Fail(kind FailureKind, message string) error { return &Failure{kind, message} }
