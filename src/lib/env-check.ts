// Environment configuration checker
// Run this to debug environment variable issues

console.log('🔍 Environment Variables Check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('');

const requiredVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

console.log('🔥 Firebase Environment Variables:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '❌';
  const displayValue = value ? 
    (varName.includes('API_KEY') ? value.substring(0, 10) + '...' : value) : 
    'MISSING';
  
  console.log(`${status} ${varName}: ${displayValue}`);
});

const missingVars = requiredVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.log('');
  console.log('❌ Missing variables:', missingVars.join(', '));
  console.log('');
  console.log('🔧 To fix:');
  console.log('1. Check that .env.local exists in project root');
  console.log('2. Verify all variables are set correctly');
  console.log('3. Restart development server: npm run dev');
  console.log('4. Clear browser cache and reload');
} else {
  console.log('');
  console.log('✅ All Firebase environment variables are configured!');
}
