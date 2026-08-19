const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseOtp() {
  const email = `test_otp_${Date.now()}@example.com`;
  
  console.log('Sending OTP to', email);
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true }
  });
  
  if (error) {
    console.error('Error sending OTP:', error.message);
  } else {
    console.log('OTP sent successfully (but we cant read it from email in this script)');
  }
}

testSupabaseOtp();
