import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

// Simple .env.local loader for production
function loadEnvLocal() {
  const envPath = resolve(process.cwd(), '.env');
  
  if (existsSync(envPath)) {
    try {
      const envContent = readFileSync(envPath, 'utf8');
      const lines = envContent.split('\n');
      
      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          if (key && valueParts.length > 0) {
            const value = valueParts.join('=').replace(/^["']|["']$/g, ''); // Remove quotes
            // Only set if not already defined
            if (!process.env[key]) {
              process.env[key] = value;
            }
          }
        }
      });
      
      console.log('[Env Loader] Successfully loaded .env.local');
      return true;
    } catch (error) {
      console.error('[Env Loader] Error reading .env.local:', error);
      return false;
    }
  } else {
    console.log('[Env Loader] .env.local not found at', envPath);
    return false;
  }
}

// Load environment variables immediately
loadEnvLocal();

export { loadEnvLocal }; 