import { LogLevel } from '../config/configuration.interface';

/**
 * A RegEx pattern that validates a comma delimited log level
 */
export const commaDelimitedLogLevel = `^(${LogLevel.Log}|${LogLevel.Error}|${LogLevel.Warn}|${LogLevel.Debug}|${LogLevel.Verbose}){1}(,(${LogLevel.Log}|${LogLevel.Error}|${LogLevel.Warn}|${LogLevel.Debug}|${LogLevel.Verbose})){0,4}$`;
