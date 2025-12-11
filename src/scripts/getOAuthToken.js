import dotenv from 'dotenv-safe'

dotenv.config({ example: '.env.example', allowEmptyValues: false })

console.log('\n🔐 Gmail OAuth2 Token Generator Guide\n')
console.log('='.repeat(60))
console.log('\n📋 Step-by-Step Instructions:\n')

console.log('1️⃣  Open Google OAuth Playground:')
console.log('   👉 https://developers.google.com/oauthplayground/\n')

console.log('2️⃣  Click the Settings gear ⚙️ (top right corner)\n')

console.log('3️⃣  Check ☑ "Use your own OAuth credentials"\n')

console.log('4️⃣  Enter these credentials:')
console.log(`   Client ID: ${process.env.GMAIL_CLIENT_ID || 'NOT SET'}`)
console.log(`   Client Secret: ${process.env.GMAIL_CLIENT_SECRET || 'NOT SET'}\n`)

console.log('5️⃣  In the left panel, scroll down and select:')
console.log('   ✅ https://mail.google.com/\n')

console.log('6️⃣  Click "Authorize APIs" button\n')

console.log('7️⃣  Sign in with your Gmail account:')
console.log(`   📧 ${process.env.GMAIL_USER || 'dyppulse@gmail.com'}\n`)

console.log('8️⃣  Click "Allow" to grant permissions\n')

console.log('9️⃣  Click "Exchange authorization code for tokens"\n')

console.log('🔟 Copy the "Refresh token" value\n')

console.log('1️⃣1️⃣  Update your .env file:')
console.log('     GMAIL_REFRESH_TOKEN=paste-your-token-here\n')

console.log('='.repeat(60))
console.log('\n💡 Tip: The refresh token is a long string. Make sure to copy it completely!\n')
