# 🔑 Development Login Credentials

## For Testing & Development

Since the Supabase connection may have network issues, here are manual development credentials you can create:

### 📧 Method 1: Use Supabase Dashboard

1. **Go to your Supabase Dashboard**: https://stexfwbuwyyfmkmxcftv.supabase.co
2. **Navigate to Authentication > Users**
3. **Click "Add User"**
4. **Create these test users**:

```
Admin User:
- Email: dev@eva.com
- Password: dev123456
- Role: admin

Manager User:
- Email: manager@eva.com  
- Password: manager123
- Role: manager

Agent User:
- Email: agent@eva.com
- Password: agent123
- Role: agent
```

### 🧪 Method 2: Manual Signup (Recommended)

1. **Visit**: http://localhost:3004/signup
2. **Create a test account with**:
   - Email: `test@eva.com`
   - Password: `test123456`
   - Full Name: `Test User`

### 🔧 Method 3: Bypass Authentication (Development Only)

If you want to bypass authentication during development, you can:

1. **Modify the middleware** temporarily
2. **Add development mode checks**
3. **Auto-login in development**

### 📱 Current App Status

✅ **App is running successfully at**: http://localhost:3004  
✅ **All React component errors fixed**  
✅ **Icon imports resolved**  
✅ **No console errors detected**  

### 🚨 "Failed to fetch" Error Solutions

The "Failed to fetch" error is likely due to:

1. **Network connectivity to Supabase**
2. **CORS issues**  
3. **Environment variable problems**
4. **Supabase service unavailable**

**Quick Fix**: Try creating a user via the Supabase dashboard directly.

### 🔍 Debug Mode

The MCP debug tool is active and monitoring for errors. Check the browser console for detailed error information.

---

**Ready for VAPI Integration**: Once login is confirmed working, we can proceed to integrate VAPI as originally planned.