// This script helps fix environment variable issues with React Server Components
// Execute with Node.js before starting the dev server

const fs = require('fs');
const path = require('path');

console.log('Setting up environment for React Server Components compatibility...');

// Check if .env.local exists, create if not
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('Creating .env.local file...');
  fs.writeFileSync(envPath, '');
} else {
  console.log('.env.local file already exists');
}

// Read existing env content
let envContent = fs.readFileSync(envPath, 'utf8');

// Add or update key environment variables
const envVars = {
  'NODE_OPTIONS': '--max-old-space-size=4096',
  'NEXT_TELEMETRY_DISABLED': '1',
  'NEXT_SHARP_PATH': './node_modules/sharp',
  'NEXT_RSC_STRICT_MODE': 'false'
};

// Update each environment variable
let updatedContent = envContent;
for (const [key, value] of Object.entries(envVars)) {
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (regex.test(updatedContent)) {
    // Update existing value
    updatedContent = updatedContent.replace(regex, `${key}=${value}`);
    console.log(`Updated ${key}=${value}`);
  } else {
    // Add new entry
    updatedContent += `\n${key}=${value}`;
    console.log(`Added ${key}=${value}`);
  }
}

// Write updated content back
if (updatedContent !== envContent) {
  fs.writeFileSync(envPath, updatedContent.trim() + '\n');
  console.log('Environment file updated successfully');
} else {
  console.log('No changes needed to environment file');
}

console.log('Environment setup complete. You can now run:');
console.log('  pnpm clean && pnpm dev'); 