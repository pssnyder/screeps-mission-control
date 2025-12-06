/**
 * Set admin custom claim for user
 * Run with: node set-admin-claim.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK with Application Default Credentials
// Uses the credentials from firebase login
process.env.GOOGLE_APPLICATION_CREDENTIALS = '';
admin.initializeApp({
    projectId: 'rts-labs-f3981',
    credential: admin.credential.applicationDefault()
});

const uid = 'QrSSaK6Tx5SyvrVsRidEoBYwIL72';
const email = 'pat@rapidtechconsultants.com';

async function setAdminClaim() {
    try {
        // Set custom claims
        await admin.auth().setCustomUserClaims(uid, { role: 'admin' });
        console.log('✅ Admin role set for:', email);
        
        // Verify
        const user = await admin.auth().getUser(uid);
        console.log('✅ Custom claims:', user.customClaims);
        
        console.log('\n⚠️  User must sign out and sign back in for claims to take effect');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

setAdminClaim();
