// Set environment variables manually to simulate Next.js dev server
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://axcrubvtpqcyscizgoee.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_nXvc3DSk2D7QBwF8fFervA_90zNdTHt';
process.env.DATABASE_URL = 'postgresql://postgres:[40223237@Lima]@db.axcrubvtpqcyscizgoee.supabase.co:5432/postgres';

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const { getTools } = require('../src/lib/ai/chat-config');
const tools = getTools(supabase);

async function test() {
  console.log('Testing tool: listar_productos...');
  try {
    const execute = tools.listar_productos.execute;
    const result = await execute({ limit: 10 });
    console.log('Success! Result:', result);
  } catch (err) {
    console.error('Error during execution:', err);
  }
}

test();
