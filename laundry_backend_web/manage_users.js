const { createClient } = require('@supabase/supabase-js');
global.WebSocket = require('ws'); // Polyfill

const supabaseUrl = process.env.SUPABASE_URL || 'https://mock.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'mock_key'; // Using secret key to ensure write access
const supabase = createClient(supabaseUrl, supabaseKey);

async function manageUsers() {
  const targetEmail = 'shaiksuhelbasha609@gmail.com';
  const targetPassword = '123456';
  
  // 1. Check if the user exists
  let { data: existingUser, error: findError } = await supabase
    .from('users')
    .select('*')
    .eq('email', targetEmail)
    .maybeSingle();

  if (existingUser) {
    // 2. Update existing user to admin
    console.log(`User ${targetEmail} exists. Updating to Admin...`);
    await supabase
      .from('users')
      .update({ role: 'admin', password: targetPassword })
      .eq('email', targetEmail);
  } else {
    // 3. Insert new admin user
    console.log(`User ${targetEmail} does not exist. Creating new Admin...`);
    await supabase
      .from('users')
      .insert([{
        user_id: 'usr_' + Math.random().toString(36).substr(2, 9),
        name: 'Shaik Suhel Basha',
        email: targetEmail,
        password: targetPassword,
        phone: 'Not provided',
        address: 'Not provided',
        role: 'admin'
      }]);
  }

  // 4. Fetch all users
  const { data: allUsers, error: fetchError } = await supabase
    .from('users')
    .select('*');

  if (fetchError) {
    console.error('Error fetching users:', fetchError);
    return;
  }

  console.log('\n--- CURRENT USERS IN SUPABASE ---');
  allUsers.forEach(u => {
    console.log(`- Name: ${u.name}`);
    console.log(`  Email: ${u.email}`);
    console.log(`  Role: ${u.role}`);
    console.log(`  Password: ${u.password}`);
    console.log('---------------------------------');
  });
}

manageUsers();
