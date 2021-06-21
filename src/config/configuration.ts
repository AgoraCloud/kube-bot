/**
 * The kube-bot environment variables configuration
 */
export default () => ({
  version: process.env.npm_package_version,
  environment: process.env.NODE_ENV,
  port: parseInt(process.env.PORT, 10),
  logLevel: process.env.LOG_LEVEL.split(','),
  discord: {
    botToken: process.env.DISCORD_BOT_TOKEN,
    botChannelId: process.env.DISCORD_BOT_CHANNEL_ID,
  },
  dockerHub: {
    token: process.env.DOCKER_HUB_TOKEN,
  },
});
