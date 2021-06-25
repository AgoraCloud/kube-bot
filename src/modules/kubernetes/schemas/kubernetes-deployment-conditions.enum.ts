/**
 * Represents a Kubernetes deployment condition types
 */
enum DeploymentConditionType {
  Available = 'Available',
  Progressing = 'Progressing',
  ReplicaFailure = 'ReplicaFailure',
}

/**
 * Represents a Kubernetes deployment condition status
 */
enum DeploymentConditionStatus {
  True = 'True',
  False = 'False',
  Unknown = 'Unknown',
}

export { DeploymentConditionType, DeploymentConditionStatus };
