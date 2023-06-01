## How to deploy with Netlify

### Step 1: 
Create new Firebase project, using the realtime database. Save the config vars for later. 

### Step 2: Initialize Netlify
```bash
npm install -g netlify-cli
netlify login
netlify init
```

### Step 3: Specify Env Vars
Use the config variables from step 1. (Although Firebase's API keys do not technically need to be kept secret is is good practice)
```bash
netlify env:set API_KEY your-api-key
netlify env:set AUTH_DOMAIN your-auth-domain
netlify env:set DATABASE_URL your-database-url
netlify env:set PROJECT_ID your-project-id
netlify env:set STORAGE_BUCKET your-storage-bucket
netlify env:set MESSAGING_SENDER_ID your-messaging-sender-id
netlify env:set APP_ID your-app-id
```

### Step 4: Set Firebase Rules within the Realtime Database
This is how Firebase intends to keep the app secure. 

```
{
"rules": {
    "lobbies": {
      // Allow any user, including unauthenticated users, to create a new lobby node
      ".write": true,
        
      "$lobbyId": {
        // Only authenticated users can read from a lobby node
        ".read": true,
        
        // Only authenticated users can write to the 'lake' node within their own lobby
        "lake": {
          ".read": true,
          ".write": "auth != null && $lobbyId === root.child('lobby').child($lobbyId).child('user').child(auth.uid).exists()"
        },
        
        // Only authenticated users can read data within their own lobby, and can only write data within their own userId node
        "users": {
          ".write": true,
            
          "$userId": {
            ".read": "auth != null",
            ".write": "auth != null && $userId === auth.uid"
          }
        }
      }
    }
  }
}
```

### Step 5: Build and Deploy
```bash
npm run build
netlify deploy --prod
```
