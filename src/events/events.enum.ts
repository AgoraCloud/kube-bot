/**
 * Represents all the possible internally emitted events
 */
export enum Event {
  ContainerImagePushed = 'container.image.pushed',
  DeploymentProcessing = 'kubernetes.deployment.processing',
  DeploymentSucceeded = 'kubernetes.deployment.succeeded',
  DeploymentFailed = 'kubernetes.deployment.failed',
}
