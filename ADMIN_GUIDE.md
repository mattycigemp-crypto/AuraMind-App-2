# AuraMind Admin Guide

## Overview
This guide explains the role-based permission system, admin features, and testing utilities for AuraMind.

## Role-Based Permission System

### Role Hierarchy
AuraMind uses a hierarchical role system with the following levels (highest to lowest):

1. **Owner** (Level 100)
   - Full system access
   - Can manage all roles including other Owners
   - Can delete users
   - Can modify all settings
   - Free access to all features

2. **CEO** (Level 90)
   - Executive access
   - Can manage Admins, Employees, and Users
   - Can view all data and analytics
   - Can manage settings
   - Free access to all features

3. **Admin** (Level 80)
   - Administrative access
   - Can manage Employees and Users
   - Can manage users and content
   - Can manage coupons
   - Free access to all features

4. **Employee** (Level 50)
   - Staff access
   - Can view analytics
   - Can manage basic operations
   - Limited admin panel access
   - Standard subscription required

5. **User** (Level 10)
   - Standard user access
   - No admin panel access
   - Standard subscription required

### Permission Matrix

| Permission | Owner | CEO | Admin | Employee | User |
|------------|-------|-----|-------|----------|------|
| Access Admin Panel | ✓ | ✓ | ✓ | ✓ | ✗ |
| Manage Users | ✓ | ✓ | ✓ | ✗ | ✗ |
| Manage Roles | ✓ | ✓ | ✗ | ✗ | ✗ |
| View Analytics | ✓ | ✓ | ✓ | ✓ | ✗ |
| Manage Coupons | ✓ | ✓ | ✓ | ✗ | ✗ |
| Manage Settings | ✓ | ✓ | ✗ | ✗ | ✗ |
| View All Data | ✓ | ✓ | ✗ | ✗ | ✗ |
| Delete Users | ✓ | ✗ | ✗ | ✗ | ✗ |
| Free Access | ✓ | ✓ | ✓ | ✗ | ✗ |

### Role Management Rules

1. **Can Manage Role**: A user can only manage roles at or below their level
   - Owner can manage everyone
   - CEO can manage everyone except Owner
   - Admin can manage Employees and Users
   - Employees and Users cannot manage roles

2. **Owner Protection**: The owner email (`matty.cigemp@gmail.com`) is hardcoded and cannot be changed

3. **Role Assignment**: When a role is changed, the `is_admin` flag is automatically updated:
   - Owner, CEO, Admin → `is_admin = true`
   - Employee, User → `is_admin = false`

## Admin Access & Permissions

### How Role is Determined
Role is determined by:
1. **User Metadata**: `user.user_metadata.role` (owner, ceo, admin, employee, user)
2. **Default**: `user.email === 'matty.cigemp@gmail.com'` → Owner, otherwise User

### Admin Privileges by Role

**Owner & CEO:**
- Full admin panel access
- Free access to all features
- Can manage roles and permissions
- Can view all system data

**Admin:**
- Full admin panel access
- Free access to all features
- Can manage users and content
- Can manage coupons

**Employee:**
- Limited admin panel access
- Can view analytics
- Standard subscription required
- Cannot manage other users

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

#### `/api/toggle-admin` (Legacy - Use set_role instead)
- **Method**: POST
- **Auth**: Requires admin JWT
- **Body**: `{ targetUserId, makeAdmin }`
- **Purpose**: Grant or revoke admin status (deprecated, use set_role)
- **Restriction**: Cannot revoke owner admin status

#### `/api/admin-test-utility` - Role Management
- **Method**: POST
- **Auth**: Requires admin JWT
- **Actions**:
  - `set_role`: Change user role (owner, ceo, admin, employee, user)
  - `grant_admin`: Legacy admin grant (use set_role instead)
  - `revoke_admin`: Legacy admin revoke (use set_role instead)
  - `set_subscription`: Manually set subscription status
  - `create_test_user`: Create test account with specific role
  - `get_user_details`: Get detailed user information

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

### 1. Create Test User with Specific Role
1. Go to Admin Console → Testing Tools
2. Enter test email and password
3. Select desired role (User, Employee, Admin, CEO, Owner)
4. Click "Create Test User"
5. New user can immediately log in and test features

### 2. Test Role-Based Permissions
1. Create test users with different roles
2. Log in as each role and verify:
   - **Owner**: Full access, can manage all roles
   - **CEO**: Can manage Admin/Employee/User, not Owner
   - **Admin**: Can manage Employee/User, not CEO/Owner
   - **Employee**: Can view analytics, limited admin access
   - **User**: No admin access, standard features only

### 3. Test Role Management
1. Log in as Owner or CEO
2. Go to Admin Console → User Management
3. Click "Details" on a user
4. Use role management buttons to change roles
5. Verify role hierarchy restrictions apply

### 4. Test Subscription Flow by Role
1. Create test users with different roles
2. **Owner/CEO/Admin**: Should have free access automatically
3. **Employee/User**: Should require subscription for premium features
4. Test subscription upgrade/downgrade flows

### 5. Run System Diagnostics
1. Go to Admin Console → Testing Tools
2. Click "Run Tests"
3. Review test results:
   - Supabase connection
   - Stripe API
   - Admin users count by role
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
const permissions = getPermissions(profile.role || UserRole.USER);
if (permissions.hasFreeAccess) {
  setSubscriptionStatus('active');
} else {
  await checkSubscription(session.user.id, session.user.email || '');
}
```

This means:
- Owner, CEO, and Admin roles skip subscription check
- `subscriptionStatus` is set to `'active'`
- All premium features are accessible
- No payment required
- Employee and User roles require valid subscription

## UI Role Indicators

The admin dashboard uses color coding to distinguish roles:

- **Owner**: Purple (`text-purple-400`)
- **CEO**: Blue (`text-blue-400`)
- **Admin**: Green (`text-emerald-400`)
- **Employee**: Yellow (`text-yellow-400`)
- **User**: Gray (`text-arch-muted`)

These colors appear in:
- User management table
- User details modal
- Sidebar role display
- Role selection dropdowns

## Support

For issues with:
- **Admin access**: Check user metadata and email
- **API endpoints**: Verify environment variables
- **Dashboard features**: Run system diagnostics
- **Payment issues**: Check Stripe configuration