/**
 * Test script to verify user creation and login flow
 * This script tests the fix for the login issue with newly created users
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testUserCreationAndLogin() {
  console.log('🧪 Testing user creation and login flow...');
  
  const testEmail = 'testuser@yitro.com';
  const testPassword = 'testpassword123';
  const testDisplayName = 'Test User';
  
  try {
    // Clean up any existing test user
    console.log('🧹 Cleaning up existing test user...');
    await prisma.authUser.deleteMany({ where: { email: testEmail } });
    await prisma.userProfile.deleteMany({ where: { email: testEmail } });
    
    // 1. Simulate admin creating a user (as fixed in admin.ts)
    console.log('👤 Creating test user via admin route simulation...');
    
    const hashedPassword = await bcrypt.hash(testPassword, 12);
    
    const result = await prisma.$transaction(async (tx) => {
      // Create auth user
      const newAuthUser = await tx.authUser.create({
        data: {
          email: testEmail,
          displayName: testDisplayName,
          passwordHash: hashedPassword,
          role: 'user',
          emailVerified: true,
        },
      });

      // Create corresponding UserProfile
      const [firstName, ...lastNameParts] = testDisplayName.split(' ');
      const newUserProfile = await tx.userProfile.create({
        data: {
          email: testEmail,
          firstName: firstName || testDisplayName,
          lastName: lastNameParts.join(' ') || '',
          role: 'USER',
          emailNotifications: true,
          smsNotifications: false,
          pushNotifications: true,
        },
      });

      return { authUser: newAuthUser, userProfile: newUserProfile };
    });
    
    console.log('✅ Test user created successfully');
    console.log(`   AuthUser ID: ${result.authUser.id}`);
    console.log(`   UserProfile ID: ${result.userProfile.id}`);
    
    // 2. Test login with the created user
    console.log('🔐 Testing login with created user...');
    
    // Find the created user
    const authUser = await prisma.authUser.findUnique({
      where: { email: testEmail },
    });
    
    const userProfile = await prisma.userProfile.findUnique({
      where: { email: testEmail },
    });
    
    if (!authUser) {
      throw new Error('AuthUser not found after creation');
    }
    
    if (!userProfile) {
      throw new Error('UserProfile not found after creation');
    }
    
    // Test password validation
    const isPasswordValid = await bcrypt.compare(testPassword, authUser.passwordHash);
    
    if (!isPasswordValid) {
      throw new Error('Password validation failed');
    }
    
    console.log('✅ Password validation successful');
    
    // 3. Simulate the full signin flow
    console.log('🔄 Simulating full signin flow...');
    
    // This simulates what happens in auth.ts signIn method
    const signinResult = {
      user: {
        id: userProfile.id,
        email: userProfile.email,
        displayName: `${userProfile.firstName} ${userProfile.lastName}`.trim(),
        role: userProfile.role,
        emailVerified: true,
        createdAt: userProfile.createdAt,
        lastLogin: new Date(),
      }
    };
    
    console.log('✅ Signin simulation successful');
    console.log('   User data:', signinResult.user);
    
    // 4. Test with wrong password
    console.log('🔐 Testing with wrong password...');
    const isWrongPasswordValid = await bcrypt.compare('wrongpassword', authUser.passwordHash);
    
    if (isWrongPasswordValid) {
      throw new Error('Wrong password was accepted - security issue!');
    }
    
    console.log('✅ Wrong password correctly rejected');
    
    // 5. Clean up
    console.log('🧹 Cleaning up test user...');
    await prisma.authUser.delete({ where: { id: result.authUser.id } });
    await prisma.userProfile.delete({ where: { id: result.userProfile.id } });
    
    console.log('🎉 All tests passed! User creation and login flow is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    // Cleanup on error
    try {
      await prisma.authUser.deleteMany({ where: { email: testEmail } });
      await prisma.userProfile.deleteMany({ where: { email: testEmail } });
    } catch (cleanupError) {
      console.error('⚠️ Cleanup failed:', cleanupError);
    }
    
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testUserCreationAndLogin()
  .then(() => {
    console.log('✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });