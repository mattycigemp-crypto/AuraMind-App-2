# AuraMind Admin Guide

## Overview
This guide explains the admin system, permissions, and testing utilities for AuraMind.

## Admin Access & Permissions

### How Admin Status is Determined
Admin status is checked in two ways:
1. **User Metadata**: `user.user_metadata.is_admin = true`
2. **Hardcoded Owner**: `user.email === 'matty.cigemp@gmail.com'`

### Admin Privileges
- **Free Access**: Admins automatically get `subscriptionStatus = 'active'`, bypassing payment requirements
- **User Management**: View, modify, and manage all users via Admin Console
- **Coupon Management**: Create and manage promotional codes
- **System Diagnostics**: Run health checks on API integrations
- **Test User Creation**: Generate test accounts for testing purposes

## Admin Dashboard

### Location
`/admin/vault` - Accessible only to users with admin status

### Panels

#### 1. User Management
- View all registered users
- Toggle admin status (except for owner)
- View user plans and join dates
- Requires `SUPABASE_SERVICE_ROLE_KEY` environment variable

#### 2. Promo Codes
- Create discount coupons
- Set duration (once, repeating, forever)
- Configure percent or amount discounts
- View active coupons and redemption counts
- Delete/archive coupons

#### 3. Analytics
- View total user count
- Track active subscriptions
- Monitor trial users
- See admin count
- View user growth timeline

#### 4. Platform Config
- Check environment configuration
- Verify API credentials (Supabase, Stripe, Resend)
- System status indicators

#### 5. Testing Tools
- Run system diagnostics
- Create test users
- Test admin endpoints
- View testing guide

## API Endpoints

### Admin-Only Endpoints

#### `/api/list-users`
- **Method**: GET
- **Auth**: Requires admin JWT
- **Purpose**: List all users with metadata
- **Response**: Array of user objects with admin status, plans, etc.

#### `/api/toggle-admin`
- **Method**: POST
- **Auth**: Requires admin JWT
- **Body**: `{ targetUserId, makeAdmin }`
- **Purpose**: Grant or revoke admin status
- **Restriction**: Cannot revoke owner admin status

#### `/api/create-coupon`
- **Method**: POST
- **Auth**: Requires admin JWT
- **Body**: Coupon configuration (id, name, discount, duration)
- **Purpose**: Create Stripe promotional codes

#### `/api/list-coupons`
- **Method**: GET
- **Auth**: Requires admin JWT
- **Purpose**: List all active coupons

#### `/api/delete-coupon`
- **Method**: POST
- **Auth**: Requires admin JWT
- **Body**: `{ couponId }`
- **Purpose**: Archive/delete coupon

#### `/api/test-admin`
- **Method**: GET
- **Auth**: Requires admin JWT
- **Purpose**: Run system diagnostics
- **Tests**: Supabase connection, Stripe API, admin users, subscriptions

#### `/api/admin-test-utility`
- **Method**: POST
- **Auth**: Requires admin JWT
- **Actions**:
  - `grant_admin`: Grant admin access to user
  - `revoke_admin`: Revoke admin access from user
  - `set_subscription`: Manually set subscription status
  - `create_test_user`: Create test account
  - `get_user_details`: Get detailed user information

## Testing Guide

### 1. Create Test User
1. Go to Admin Console → Testing Tools
2. Enter test email and password
3. Optionally grant admin access
4. Click "Create Test User"
5. New user can immediately log in and test features

### 2. Test Admin Features
1. Create a test user with admin access
2. Log in as test admin
3. Verify access to Admin Console
4. Test user management operations
5. Verify free access to all features

### 3. Test Subscription Flow
1. Create regular test user (no admin)
2. Attempt to access premium features
3. Verify redirect to payment page
4. Use admin utility to set subscription manually
5. Verify premium access is granted

### 4. Run System Diagnostics
1. Go to Admin Console → Testing Tools
2. Click "Run Tests"
3. Review test results:
   - Supabase connection
   - Stripe API
   - Admin users count
   - Active subscriptions

## Environment Variables Required

### For Admin Features
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for admin operations
- `STRIPE_SECRET_KEY`: Stripe API secret for payment/coupon operations
- `RESEND_API_KEY`: Resend API for email notifications

### For Admin Dashboard
- `VITE_SUPABASE_URL`: Client-side Supabase URL
- `NEXT_PUBLIC_APP_URL`: App URL for email links

## Security Notes

### Admin Protection
- All admin endpoints verify JWT tokens
- Double-check admin status (metadata + email)
- Service role key required for user operations
- Owner email hardcoded as ultimate admin

### Best Practices
1. Never commit service role keys to git
2. Use environment variables in production
3. Regularly audit admin users list
4. Monitor admin endpoint usage
5. Test admin operations in staging first

## Troubleshooting

### "Server configuration error: Missing Supabase Admin credentials"
- **Cause**: `SUPABASE_SERVICE_ROLE_KEY` not set
- **Fix**: Add environment variable in Vercel/local env

### "Forbidden: Only admins can perform this action"
- **Cause**: User lacks admin status
- **Fix**: Grant admin via `/api/toggle-admin` or Admin Console

### Admin Console shows no users
- **Cause**: Service role key missing or invalid
- **Fix**: Verify `SUPABASE_SERVICE_ROLE_KEY` is correct

### Stripe operations fail
- **Cause**: `STRIPE_SECRET_KEY` missing or invalid
- **Fix**: Add valid Stripe secret key to environment

## Admin Free Access Implementation

Admins automatically get free access through this logic in `App.tsx`:

```typescript
if (profile.isAdmin || profile.email === 'matty.cigemp@gmail.com') {
  setSubscriptionStatus('active');
} else {
  await checkSubscription(session.user.id, session.user.email || '');
}
```

This means:
- Admins skip subscription check
- `subscriptionStatus` is set to `'active'`
- All premium features are accessible
- No payment required

## Support

For issues with:
- **Admin access**: Check user metadata and email
- **API endpoints**: Verify environment variables
- **Dashboard features**: Run system diagnostics
- **Payment issues**: Check Stripe configuration