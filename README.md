<p align="center">
  <img src="https://user-images.githubusercontent.com/35788699/116828155-ed3ccd00-ab6a-11eb-9327-4d99bd169bdc.png" alt="Logo Cropped">
</p>
<p align="center">
    <a href="https://github.com/AgoraCloud/kube-bot/issues"><img src="https://img.shields.io/github/issues/AgoraCloud/kube-bot" alt="GitHub issues"></a> <a href="https://github.com/AgoraCloud/kube-bot/blob/main/LICENSE"><img src="https://img.shields.io/github/license/AgoraCloud/kube-bot" alt="GitHub license"></a> <img alt="GitHub release (latest by date)" src="https://img.shields.io/github/v/release/AgoraCloud/kube-bot"> <img src="https://img.shields.io/github/release-date/AgoraCloud/kube-bot" alt="GitHub Release Date"> <img alt="Docker Pulls" src="https://img.shields.io/docker/pulls/agoracloud/kube-bot"> <img src="https://img.shields.io/github/workflow/status/AgoraCloud/kube-bot/main_versioned_push" alt="GitHub Workflow Status"> <img src="https://img.shields.io/github/contributors/AgoraCloud/kube-bot" alt="GitHub contributors"> <img src="https://img.shields.io/github/commit-activity/m/AgoraCloud/kube-bot" alt="GitHub commit activity">
</p>

AgoraCloud is an open source and self hosted cloud development platform that runs in Kubernetes.

This repository contains a bot that is connected to Discord and deployed in a Kubernetes cluster. The main purpose of the bot is to automate the container update process when a new container is published for any of the `main`, `develop`, `said`, `marc` or `waleed` branches in the `server` and `ui` repositories.

The kube-bot listens for DockerHub webhook notifications and extracts useful information, such as the repository name, container name and tag name. The bot then notifies the team on Discord that a webhook has been received. Subsequently, the bot updates the container in a pre-configured Kubernetes namespace and notifies the team or team member if the deployment was successful or not. If successful, team members can view their changes live, without lifting a finger, in a production-like environment (Kubernetes cluster), on a pre-configured subdomain.

## Installation

The AgoraCloud kube-bot is installed on a Kubernetes cluster using a Helm chart. For more details, refer to the instructions in the [helm-chart directory](https://github.com/AgoraCloud/kube-bot/tree/main/helm-chart).

## Development

### Set Up

1. Clone this repository

```bash
git clone https://github.com/AgoraCloud/kube-bot.git
```

2. Change directory

```bash
cd kube-bot
```

3. Install required packages

```bash
npm i
```

4. Create a `.env` file in the root of the project with the following environment variables

> Make sure that all the environment variables below are populated. For a detailed description of all environment variables, check out the [documentation](https://github.com/AgoraCloud/kube-bot/wiki/Environment-Variables).

```bash
# Node Environment
NODE_ENV=development
# Log Level
LOG_LEVEL=log,warn,error
# Domain
DOMAIN=
# Discord
DISCORD_BOT_TOKEN=
DISCORD_BOT_CHANNEL_ID=
DISCORD_BOT_ROLES_SERVER_ID=
DISCORD_BOT_ROLES_UI_ID=
DISCORD_BOT_USERS_SAID_ID=
DISCORD_BOT_USERS_WALEED_ID=
DISCORD_BOT_USERS_MARC_ID=
# DockerHub
DOCKER_HUB_TOKEN=
```

### Running the app

```bash
# Development
npm run start

# Watch mode
npm run start:dev

# Production mode
npm run start:prod
```

### Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```
