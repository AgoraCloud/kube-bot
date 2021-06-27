/**
 * Represents a Kubernetes event reason
 */
enum EventReason {
  Started = 'Started',
}

/**
 * Represents a Kubernetes event related kind
 */
enum EventRelatedKind {
  Pod = 'Pod',
}

export { EventReason, EventRelatedKind };
