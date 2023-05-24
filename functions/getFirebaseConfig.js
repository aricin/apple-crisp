exports.handler = async (event, context) => {
    const firebaseConfig = {
      apiKey: process.env.VITE_API_KEY,
      authDomain: process.env.VITE_AUTH_DOMAIN,
      databaseURL: process.env.VITE_DATABASE_URL,
      projectId: process.env.VITE_PROJECT_ID,
      storageBucket: process.env.VITE_STORAGE_BUCKET,
      messagingSenderId: process.env.VITE_MESSAGING_SENDER_ID,
      appId: process.env.VITE_APP_ID,
    };
    
    return {
      statusCode: 200,
      body: JSON.stringify(firebaseConfig),
    };
  };
  