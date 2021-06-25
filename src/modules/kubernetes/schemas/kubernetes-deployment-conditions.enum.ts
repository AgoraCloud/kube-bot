enum DeploymentConditionType {
  Available = 'Available',
  Progressing = 'Progressing',
  ReplicaFailure = 'ReplicaFailure',
}

enum DeploymentConditionStatus {
  True = 'True',
  False = 'False',
  Unknown = 'Unknown',
}

export { DeploymentConditionType, DeploymentConditionStatus };
