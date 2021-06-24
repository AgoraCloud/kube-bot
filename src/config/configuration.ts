/**
 * The kube-bot environment variables configuration
 */
export default () => ({
  version: process.env.npm_package_version,
  environment: process.env.NODE_ENV,
  port: parseInt(process.env.PORT, 10),
  logLevel: process.env.LOG_LEVEL.split(','),
  discord: {
    bot: {
      token: process.env.DISCORD_BOT_TOKEN,
      channelId: process.env.DISCORD_BOT_CHANNEL_ID,
    },
    roles: {
      serverRoleId: process.env.DISCORD_BOT_ROLES_SERVER_ID,
      uiRoleId: process.env.DISCORD_BOT_ROLES_UI_ID,
    },
    users: {
      saidsUserId: process.env.DISCORD_BOT_USERS_SAID_ID,
      waleedsUserId: process.env.DISCORD_BOT_USERS_WALEED_ID,
      marcsUserId: process.env.DISCORD_BOT_USERS_MARC_ID,
    },
  },
  dockerHub: {
    token: process.env.DOCKER_HUB_TOKEN,
  },
});
