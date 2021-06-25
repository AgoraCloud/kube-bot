/**
 * The kube-bot configuration
 */
interface Config {
  version: string;
  environment: EnvironmentConfig;
  port: number;
  domain: string;
  logLevel: LogLevel[];
  discord: DiscordConfig;
  dockerHub: DockerHubConfig;
}

/**
 * The kube-bot Discord configuration
 */
interface DiscordConfig {
  bot: DiscordBotConfig;
  roles: DiscordRolesConfig;
  users: DiscordUsersConfig;
}

/**
 * The kube-bot Discord bot configuration
 */
interface DiscordBotConfig {
  token: string;
  channelId: string;
}

/**
 * The kube-bot Discord roles configuration
 */
interface DiscordRolesConfig {
  serverRoleId: string;
  uiRoleId: string;
}

/**
 * The kube-bot Discord users configuration
 */
interface DiscordUsersConfig {
  saidsUserId: string;
  waleedsUserId: string;
  marcsUserId: string;
}

/**
 * The kube-bot DockerHub configuration
 */
interface DockerHubConfig {
  token: string;
}

/**
 * The kube-bot environment configuration
 */
enum EnvironmentConfig {
  Development = 'development',
  Production = 'production',
}

/**
 * The kube-bot log level configuration
 */
enum LogLevel {
  Log = 'log',
  Error = 'error',
  Warn = 'warn',
  Debug = 'debug',
  Verbose = 'verbose',
}

export {
  Config,
  DiscordConfig,
  DiscordBotConfig,
  DiscordRolesConfig,
  DiscordUsersConfig,
  DockerHubConfig,
  EnvironmentConfig,
  LogLevel,
};
