/**
 * Fix user role to 'provider' and ensure ProviderProfile exists.
 * Usage: node fix_user_role.js <email>
 * Example: node fix_user_role.js nasani@example.com
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

const email = process.argv[2];
if (!email) {
  console.error('Usage: node fix_user_role.js <email>');
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);
console.log('Connected to MongoDB');

// Dynamic import after connect
const User = (await import('./src/models/User.js')).default;
const ProviderProfile = (await import('./src/models/ProviderProfile.js')).default;

const user = await User.findOne({ email: email.toLowerCase() });
if (!user) {
  console.error(`No user found with email: ${email}`);
  process.exit(1);
}

console.log(`Found user: ${user.name} | current role: ${user.role}`);

// Update role to provider
user.role = 'provider';
await user.save();
console.log(`✓ Role updated to 'provider'`);

// Ensure ProviderProfile exists
let profile = await ProviderProfile.findOne({ user: user._id });
if (!profile) {
  profile = await ProviderProfile.create({ user: user._id });
  console.log('✓ ProviderProfile created');
} else {
  console.log('✓ ProviderProfile already exists');
}

console.log('\nDone! The user can now:');
console.log('  - Access provider APIs');
console.log('  - Create and pay for subscriptions');
console.log('  - Publish services');
console.log('\nIMPORTANT: The user must log out and log back in to get a new JWT with the provider role.');

await mongoose.disconnect();
