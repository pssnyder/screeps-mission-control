# Screeps Mission Control v2.0 - Deployment Guide

## Overview
AI-driven development platform and analytics dashboard for Screeps colonies. Deployed to Firebase Hosting at `screeps.labs.rapidtechconsultants.com`.

## Prerequisites
- Node.js 20+
- Firebase CLI (`npm install -g firebase-tools`)
- GCP Project: rts-labs-f3981
- Screeps API token
- GitHub Personal Access Token
- Claude API key (Anthropic)

## Project Structure
```
screeps-mission-control/
├── public/                          # Frontend (Firebase Hosting)
│   ├── analytics.html              # Public analytics dashboard
│   ├── colony_management.html      # Admin control panel
│   ├── code_development.html       # AI code editor (Phase 3)
│   ├── css/
│   │   └── mission-control.css     # Existing styles
│   └── js/
│       ├── analytics-dashboard.js  # Analytics charts
│       ├── colony-management.js    # Colony controls
│       └── code-editor.js          # Code editor (Phase 3)
├── functions/                       # Cloud Functions
│   ├── index.js                    # All backend functions
│   └── package.json
├── firebase.json                    # Firebase config
├── firestore.rules                  # Security rules
├── firestore.indexes.json          # Database indexes
└── .firebaserc                     # Project config
```

## Initial Setup

### 1. Install Dependencies
```bash
cd "s:\Programming\Gaming Projects\Screeps World\screeps-mission-control"
npm install

cd functions
npm install
cd ..
```

### 2. Firebase Authentication
```bash
firebase login
firebase use rts-labs-f3981
```

### 3. Set Up Secrets
You'll need to provide these values:

```bash
# Screeps API Token
firebase functions:secrets:set SCREEPS_TOKEN
# Enter your Screeps API token when prompted

# GitHub Personal Access Token (repo scope)
firebase functions:secrets:set GITHUB_PAT
# Enter your GitHub PAT when prompted

# Claude API Key (Anthropic)
firebase functions:secrets:set CLAUDE_API_KEY
# Enter your Claude API key when prompted
```

### 4. Configure Firebase Client
Update `public/js/analytics-dashboard.js` and `public/js/colony-management.js`:

Replace `YOUR_API_KEY` and `YOUR_APP_ID` with your Firebase web app credentials:
1. Go to Firebase Console → Project Settings → General
2. Scroll to "Your apps" → Web apps
3. Copy `apiKey` and `appId`

### 5. Create Admin User
```bash
# Via Firebase Console:
# 1. Go to Authentication → Users → Add user
# 2. Email: pssnyder@rapidtechconsultants.com
# 3. Password: [your secure password]
# 4. Note the User UID

# Set custom claims (admin role):
firebase functions:shell
> admin.auth().setCustomUserClaims('USER_UID_HERE', { role: 'admin' })
```

Or use this Node.js script:
```javascript
const admin = require('firebase-admin');
admin.initializeApp();

async function setAdminRole() {
  const email = 'pssnyder@rapidtechconsultants.com';
  const user = await admin.auth().getUserByEmail(email);
  await admin.auth().setCustomUserClaims(user.uid, { role: 'admin' });
  console.log(`Admin role set for ${email}`);
}

setAdminRole();
```

### 6. Deploy to Firebase
```bash
# Deploy everything
firebase deploy

# Or deploy incrementally:
firebase deploy --only firestore:rules,firestore:indexes
firebase deploy --only functions
firebase deploy --only hosting
```

### 7. Configure Custom Domain
```bash
# Add domain to Firebase Hosting
firebase hosting:channel:deploy production --expires 30d

# DNS Configuration (in your domain registrar):
# Add CNAME record:
# Host: screeps.labs
# Points to: rts-labs-f3981.web.app
# TTL: 3600
```

Then in Firebase Console:
1. Go to Hosting → Add custom domain
2. Enter: `screeps.labs.rapidtechconsultants.com`
3. Follow verification steps
4. SSL certificate auto-provisioned

### 8. Set Up Cloud Scheduler
The `collectDailyTelemetry` function runs automatically at 2 AM daily. Verify:

```bash
gcloud scheduler jobs list --project=rts-labs-f3981
```

If not created, deploy functions again:
```bash
firebase deploy --only functions:collectDailyTelemetry
```

## Testing

### Local Testing with Emulators
```bash
firebase emulators:start

# Access at:
# - Hosting: http://localhost:5000
# - Functions: http://localhost:5001
# - Firestore: http://localhost:8080
# - Auth: http://localhost:9099
# - Emulator UI: http://localhost:4000
```

### Test Cloud Functions Directly
```bash
# Test console command
curl -X POST https://us-central1-rts-labs-f3981.cloudfunctions.net/screepsConsole \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  -d '{"command": "Game.time"}'

# Test daily telemetry (manual trigger)
gcloud functions call collectDailyTelemetry --project=rts-labs-f3981
```

## URLs

- **Public Analytics**: `https://screeps.labs.rapidtechconsultants.com/analytics.html`
- **Colony Management**: `https://screeps.labs.rapidtechconsultants.com/colony_management.html` (admin only)
- **Code Development**: `https://screeps.labs.rapidtechconsultants.com/code_development.html` (Phase 3, admin only)

## Monitoring

### Cloud Monitoring Dashboard
```bash
# View function logs
firebase functions:log

# Or in GCP Console:
# Logging → Logs Explorer → Select Cloud Functions
```

### Firestore Usage
Check usage in Firebase Console → Firestore → Usage tab
- Reads: Free tier 50K/day
- Writes: Free tier 20K/day
- Storage: Free tier 1GB

### Cost Estimates
- **Firestore**: ~$1/month (mostly reads from analytics)
- **Cloud Functions**: ~$2-5/month (daily cron + API calls)
- **Firebase Hosting**: Free (under 10GB/month)
- **Cloud Storage**: Negligible
- **AI (Claude API)**: ~$6-30/month (depends on usage)
- **Total**: $10-40/month

### Billing Alerts
Set up in GCP Console → Billing → Budgets & alerts:
- Alert at $10 (daily)
- Alert at $50 (monthly)
- Email: pssnyder@rapidtechconsultants.com

## Troubleshooting

### Function Deploy Fails
```bash
# Check Node.js version in functions/package.json
"engines": { "node": "20" }

# Verify secrets are set
firebase functions:secrets:access SCREEPS_TOKEN
```

### Auth Not Working
```bash
# Verify Firebase config in JS files
# Check that custom claims are set for admin user
firebase functions:shell
> admin.auth().getUser('USER_UID').then(u => console.log(u.customClaims))
```

### Daily Collection Not Running
```bash
# Check Cloud Scheduler
gcloud scheduler jobs describe collectDailyTelemetry --location=us-east1 --project=rts-labs-f3981

# Manually trigger
gcloud scheduler jobs run collectDailyTelemetry --location=us-east1 --project=rts-labs-f3981
```

### CORS Issues
Functions already configured with CORS. If issues persist:
```javascript
// In functions/index.js, all endpoints use:
const cors = require('cors')({ origin: true });
```

## Security Checklist

- [x] Firestore rules enforce admin-only writes
- [x] Analytics reads are public (read-only)
- [x] Firebase Auth required for admin sections
- [x] Custom claims verify admin role
- [x] Secrets stored in Secret Manager (not code)
- [x] GitHub PAT has minimal scope (repo only)
- [x] Screeps token has minimal scope (console + code)
- [x] Rate limiting on AI endpoints (50/day)
- [x] HTTPS enforced via Firebase Hosting

## Next Steps

Once Phase 1 & 2 are deployed and tested:

### Phase 3: AI Code Editor
- Create `code_development.html`
- Integrate Monaco Editor
- Implement client-side file management
- Connect AI chat to backend
- Test GitHub commit workflow
- Deploy branch switching

### Phase 4: Enhancements
- Multi-room support (dropdown selector)
- Analytics date range filtering
- Console command autocomplete
- Mobile-responsive admin UI
- Real-time collaboration (future)

## Support

Issues or questions:
- GitHub: pssnyder/screeps-mission-control (private repo)
- Email: pssnyder@rapidtechconsultants.com
