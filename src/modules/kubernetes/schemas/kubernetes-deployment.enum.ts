/**
 * Represents all Kubernetes deployment names, both server and UI, of
 * AgoraCloud deployments in the Kubernetes cluster
 */
export enum KubernetesDeployment {
  // Server Deployment Names
  AgoraCloudProductionServer = 'agoracloud-agoracloud-prod-server',
  AgoraCloudDevelopmentServer = 'agoracloud-agoracloud-dev-server',
  AgoraCloudSaidServer = 'agoracloud-agoracloud-said-server',
  AgoraCloudWaleedServer = 'agoracloud-agoracloud-waleed-server',
  AgoraCloudMarcServer = 'agoracloud-agoracloud-marc-server',
  // UI Deployment names
  AgoraCloudProductionUi = 'agoracloud-agoracloud-prod-ui',
  AgoraCloudDevelopmentUi = 'agoracloud-agoracloud-dev-ui',
  AgoraCloudSaidUi = 'agoracloud-agoracloud-said-ui',
  AgoraCloudWaleedUi = 'agoracloud-agoracloud-waleed-ui',
  AgoraCloudMarcUi = 'agoracloud-agoracloud-marc-ui',
}
