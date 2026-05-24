require('dotenv').config({ path: '.env.local' });
const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (!key) {
  console.error("No GOOGLE_GENERATIVE_AI_API_KEY configured in .env.local!");
  process.exit(1);
}

console.log("Using API Key starting with:", key.substring(0, 10));

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

async function test() {
  try {
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.error) {
      console.error("API Error:", data.error);
    } else {
      console.log("Success! Available models:");
      if (data.models) {
        data.models.forEach(m => {
          console.log(`- ${m.name} (${m.displayName}) [${m.supportedGenerationMethods.join(', ')}]`);
        });
      } else {
        console.log("No models returned in payload:", data);
      }
    }
  } catch (err) {
    console.error("Connection error:", err);
  }
}

test();
