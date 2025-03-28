const crypto = require('crypto');

function generateSecureSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

console.log('\nGenerated secure secrets for production use:\n');
console.log('SESSION_SECRET=' + generateSecureSecret());
console.log('ADMIN_API_SECRET=' + generateSecureSecret());
console.log('\nAdd these to your production environment variables.\n');