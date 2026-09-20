/**
 * util/envValidator.ts
 *
 * Boot-time validation of critical environment variables.
 * Fails fast and prevents the application from starting if misconfigured.
 */

export function validateEnvVars(requiredVars: string[]) {
  const missing = requiredVars.filter(env => !process.env[env]);

  if (missing.length > 0) {
    const errorMsg = `CRITICAL FAILURE: Missing required environment variables: ${missing.join(', ')}`;
    
    // Log estruturado JSON no stdout para o DataDog/Splunk capturar
    process.stdout.write(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'FATAL',
      event: 'EnvironmentValidationFailed',
      service: 'zyconomes-api',
      message: errorMsg
    }) + '\n');
    
    // Aborta o processo imediatamente
    process.exit(1);
  }

  process.stdout.write(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'INFO',
    event: 'EnvironmentValidationSuccess',
    service: 'zyconomes-api',
    message: 'All critical environment variables are present.'
  }) + '\n');
}
