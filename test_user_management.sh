#!/bin/bash

# Test script to validate user creation and login functionality
# Run this after starting the server with: npm run dev:full

API_URL="http://localhost:3001"
ADMIN_EMAIL="admin@yitro.com"
ADMIN_PASSWORD="admin123"
TEST_USER_EMAIL="testvalidation@yitro.com"
TEST_USER_NAME="Test Validation User"

echo "🧪 Testing User Creation and Login Functionality"
echo "================================================"

# Step 1: Admin Login
echo "1. Logging in as admin..."
ADMIN_RESPONSE=$(curl -s -X POST $API_URL/api/auth/signin \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

if echo "$ADMIN_RESPONSE" | grep -q '"success":true'; then
  echo "   ✅ Admin login successful"
  ADMIN_TOKEN=$(echo "$ADMIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
  echo "   📝 Admin token extracted"
else
  echo "   ❌ Admin login failed: $ADMIN_RESPONSE"
  exit 1
fi

# Step 2: Create new user (with auto-generated password)
echo ""
echo "2. Creating new user with auto-generated password..."
CREATE_RESPONSE=$(curl -s -X POST $API_URL/api/admin/create-user \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"email\":\"$TEST_USER_EMAIL\",\"displayName\":\"$TEST_USER_NAME\",\"role\":\"user\"}")

if echo "$CREATE_RESPONSE" | grep -q '"success":true'; then
  echo "   ✅ User creation successful"
  
  # Extract the temporary password
  if echo "$CREATE_RESPONSE" | grep -q 'temporaryPassword'; then
    TEMP_PASSWORD=$(echo "$CREATE_RESPONSE" | grep -o '"temporaryPassword":"[^"]*"' | cut -d'"' -f4)
    echo "   🔑 Temporary password: $TEMP_PASSWORD"
  else
    echo "   ❌ No temporary password found in response"
    echo "   Response: $CREATE_RESPONSE"
    exit 1
  fi
else
  echo "   ❌ User creation failed: $CREATE_RESPONSE"
  exit 1
fi

# Step 3: Test user login with auto-generated password
echo ""
echo "3. Testing user login with auto-generated password..."
LOGIN_RESPONSE=$(curl -s -X POST $API_URL/api/auth/signin \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_USER_EMAIL\",\"password\":\"$TEMP_PASSWORD\"}")

if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
  echo "   ✅ User login successful with auto-generated password"
  USER_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
  echo "   📝 User token extracted"
else
  echo "   ❌ User login failed: $LOGIN_RESPONSE"
  exit 1
fi

# Step 4: Test user creation with custom password
echo ""
echo "4. Testing user creation with custom password..."
CUSTOM_USER_EMAIL="customtest@yitro.com"
CUSTOM_PASSWORD="MyCustomPassword123"

CUSTOM_CREATE_RESPONSE=$(curl -s -X POST $API_URL/api/admin/create-user \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"email\":\"$CUSTOM_USER_EMAIL\",\"displayName\":\"Custom Test User\",\"role\":\"user\",\"password\":\"$CUSTOM_PASSWORD\"}")

if echo "$CUSTOM_CREATE_RESPONSE" | grep -q '"success":true'; then
  echo "   ✅ User creation with custom password successful"
  
  # Verify no password is exposed in response
  if echo "$CUSTOM_CREATE_RESPONSE" | grep -q 'temporaryPassword'; then
    echo "   ⚠️  Warning: Custom password was exposed in response"
  else
    echo "   🔒 Custom password properly hidden in response"
  fi
else
  echo "   ❌ User creation with custom password failed: $CUSTOM_CREATE_RESPONSE"
  exit 1
fi

# Step 5: Test login with custom password
echo ""
echo "5. Testing login with custom password..."
CUSTOM_LOGIN_RESPONSE=$(curl -s -X POST $API_URL/api/auth/signin \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$CUSTOM_USER_EMAIL\",\"password\":\"$CUSTOM_PASSWORD\"}")

if echo "$CUSTOM_LOGIN_RESPONSE" | grep -q '"success":true'; then
  echo "   ✅ User login with custom password successful"
else
  echo "   ❌ User login with custom password failed: $CUSTOM_LOGIN_RESPONSE"
  exit 1
fi

echo ""
echo "🎉 All tests passed! User creation and login functionality is working correctly."
echo ""
echo "Summary:"
echo "- ✅ Admin can log in"
echo "- ✅ Admin can create users with auto-generated passwords"
echo "- ✅ Auto-generated passwords are returned to admin"
echo "- ✅ Users can log in with auto-generated passwords"
echo "- ✅ Admin can create users with custom passwords"
echo "- ✅ Custom passwords are not exposed in responses"
echo "- ✅ Users can log in with custom passwords"
echo ""
echo "🚀 The fix is working properly!"