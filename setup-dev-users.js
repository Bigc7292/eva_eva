/**
 * Development User Setup Script
 * Creates a development user account for testing purposes
 */

const { createClient } = require('@supabase/supabase-js');

// Use environment variables for Supabase connection
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createDevUser() {
  console.log('🔧 Creating development user...');
  
  const devUser = {
    email: 'dev@eva.com',
    password: 'dev123456',
    role: 'admin',
    fullName: 'Development Admin'
  };

  try {
    // Create the user with admin service role
    const { data: user, error: signUpError } = await supabase.auth.admin.createUser({
      email: devUser.email,
      password: devUser.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: devUser.fullName,
        role: devUser.role
      }
    });

    if (signUpError) {
      if (signUpError.message.includes('User already registered')) {
        console.log('ℹ️  Development user already exists');
        return devUser;
      }
      throw signUpError;
    }

    console.log('✅ Development user created successfully!');
    console.log('📧 Email:', devUser.email);
    console.log('🔑 Password:', devUser.password);
    console.log('👤 Role:', devUser.role);
    
    // Create user profile
    if (user.user) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: user.user.id,
          email: devUser.email,
          full_name: devUser.fullName,
          role: devUser.role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (profileError && !profileError.message.includes('duplicate key')) {
        console.warn('⚠️  Profile creation warning:', profileError.message);
      } else {
        console.log('✅ User profile created');
      }
    }

    return devUser;

  } catch (error) {
    console.error('❌ Error creating development user:', error.message);
    throw error;
  }
}

async function createTestUsers() {
  console.log('👥 Creating additional test users...');
  
  const testUsers = [
    {
      email: 'agent@eva.com',
      password: 'agent123',
      role: 'agent',
      fullName: 'Test Agent'
    },
    {
      email: 'manager@eva.com', 
      password: 'manager123',
      role: 'manager',
      fullName: 'Test Manager'
    }
  ];

  for (const testUser of testUsers) {
    try {
      const { data: user, error } = await supabase.auth.admin.createUser({
        email: testUser.email,
        password: testUser.password,
        email_confirm: true,
        user_metadata: {
          full_name: testUser.fullName,
          role: testUser.role
        }
      });

      if (error && !error.message.includes('User already registered')) {
        console.warn(`⚠️  Warning creating ${testUser.role}:`, error.message);
        continue;
      }

      if (user.user && !error) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: user.user.id,
            email: testUser.email,
            full_name: testUser.fullName,
            role: testUser.role,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (profileError && !profileError.message.includes('duplicate key')) {
          console.warn(`⚠️  Profile warning for ${testUser.role}:`, profileError.message);
        }
      }

      console.log(`✅ ${testUser.role} user: ${testUser.email} / ${testUser.password}`);

    } catch (error) {
      console.warn(`⚠️  Error creating ${testUser.role}:`, error.message);
    }
  }
}

async function main() {
  console.log('🚀 Setting up development users for EVA App...');
  console.log('');

  try {
    const devUser = await createDevUser();
    await createTestUsers();

    console.log('');
    console.log('🎉 Development setup complete!');
    console.log('');
    console.log('📋 LOGIN CREDENTIALS:');
    console.log('┌─────────────────────────────────────────┐');
    console.log('│ DEVELOPMENT LOGIN CREDENTIALS           │');
    console.log('├─────────────────────────────────────────┤');
    console.log('│ Admin:   dev@eva.com / dev123456        │');
    console.log('│ Manager: manager@eva.com / manager123   │');
    console.log('│ Agent:   agent@eva.com / agent123       │');
    console.log('└─────────────────────────────────────────┘');
    console.log('');
    console.log('🌐 You can now login at: http://localhost:3004/login');

  } catch (error) {
    console.error('💥 Setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup
main();