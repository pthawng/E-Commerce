import { EnvConfig, validateAndFreezeConfig } from './env.schema';

let config: Readonly<EnvConfig>;

/**
 * Staff+ Enforcement: Dedicated validator that executes synchronously at startup.
 */
export function validateEnv(): Readonly<EnvConfig> {
  if (config) return config;

  config = validateAndFreezeConfig(process.env);
  return config;
}

/**
 * Type-safe getter for validated config.
 */
export function getConfig(): Readonly<EnvConfig> {
  if (!config) {
    return validateEnv();
  }
  return config;
}
