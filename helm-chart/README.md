# AgoraCloud kube-bot Helm Chart

# Prerequisites

1. Kubernetes
2. Helm (version 3+)

# Install the AgoraCloud kube-bot

1. Clone this repository

```bash
git clone https://github.com/AgoraCloud/kube-bot.git
```

2. Cd into the helm-chart directory

```bash
cd kube-bot/helm-chart
```

3. Modify the Helm chart values

```bash
nano values.yaml
```

4. Install the AgoraCloud kube-bot Helm chart

```bash
helm install kube-bot . --namespace agoracloud-kube-bot --create-namespace
```

# Uninstall the AgoraCloud kube-bot

```bash
helm uninstall kube-bot --namespace agoracloud-kube-bot
```
