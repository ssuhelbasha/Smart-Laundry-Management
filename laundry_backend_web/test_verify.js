const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseOtp() {
  const email = process.argv[2];
  const token = process.argv[3];
  
  if (!email || !token) {
    console.log("Usage: node test_verify.js <email> <token>");
    return;
  }
  
  console.log('Verifying OTP for', email, 'with token', token);
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email'
  });
  
  if (error) {
    console.error('Error verifying OTP with type=email:', error.message);
    
    console.log('Trying with type=signup...');
    const { data: d2, error: e2 } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup'
    });
    if (e2) {
      console.error('Error verifying OTP with type=signup:', e2.message);
    } else {
      console.log('Success with type=signup!', d2);
    }
  } else {
    console.log('Success with type=email!', data);
  }
}

testSupabaseOtp();
