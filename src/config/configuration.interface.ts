/**
 * The kube-bot configuration
 */
interface Config {
  version: string;
  environment: EnvironmentConfig;
  port: number;
  logLevel: LogLevel[];
  discord: DiscordConfig;
  dockerHub: DockerHubConfig;
}

/**
 * The kube-bot Discord configuration
 */
interface DiscordConfig {
  botToken: string;
  botChannelId: string;
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

export { Config, DiscordConfig, DockerHubConfig, EnvironmentConfig, LogLevel };
