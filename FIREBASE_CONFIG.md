# Firebase Web App Configuration Helper

After running `setup.sh`, get your Firebase web config:

```bash
firebase apps:sdkconfig web
```

This will output something like:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "rts-labs-f3981.firebaseapp.com",
  projectId: "rts-labs-f3981",
  storageBucket: "rts-labs-f3981.appspot.com",
  messagingSenderId: "649339903544",
  appId: "1:649339903544:web:XXXXXXXXXXXXXXXXXXXX"
};
```

## Update These Files

### 1. public/js/analytics-dashboard.js
Replace lines 7-13:
```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "rts-labs-f3981.firebaseapp.com",
    projectId: "rts-labs-f3981",
    storageBucket: "rts-labs-f3981.appspot.com",
    messagingSenderId: "649339903544",
    appId: "YOUR_APP_ID_HERE"
};
```

### 2. public/js/colony-management.js
Replace lines 7-13 with the same config.

## Create Admin User

### Option 1: Firebase Console (Easiest)
1. Go to https://console.firebase.google.com/project/rts-labs-f3981/authentication/users
2. Click "Add user"
3. Email: `pssnyder@rapidtechconsultants.com`
4. Password: [your secure password]
5. Click "Add user"
6. Note the UID (looks like: `AbCdEfGhIjKlMnOpQrStUv`)

### Option 2: Firebase CLI
```bash
firebase auth:import users.json
```

Where `users.json`:
```json
{
  "users": [{
    "uid": "admin-user-001",
    "email": "pssnyder@rapidtechconsultants.com",
    "passwordHash": "YOUR_PASSWORD_HASH",
    "emailVerified": true
  }]
}
```

## Set Admin Custom Claims

Create `set-admin.js`:
```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function setAdminClaim() {
  const email = 'pssnyder@rapidtechconsultants.com';
  
  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { 
      role: 'admin' 
    });
    
    console.log(`✓ Admin role set for ${email}`);
    console.log(`  UID: ${user.uid}`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

setAdminClaim();
```

Download service account key:
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Save as `service-account-key.json`
4. Run: `node set-admin.js`
5. **Delete `service-account-key.json` after use** (security)

## Verify Setup

```bash
# Test Firebase connection
firebase projects:list

# Check Firestore rules
firebase firestore:rules:list

# Check functions
firebase functions:list

# Deploy!
firebase deploy
```
