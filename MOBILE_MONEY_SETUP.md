# Mobile Money API Setup Guide

This guide explains how to configure MTN and Airtel mobile money APIs for the space rental application.

## Environment Variables

The following environment variables need to be configured in your `.env` file:

### MTN Mobile Money API
```env
MTN_MOBILE_MONEY_API_URL=https://sandbox.momodeveloper.mtn.com
MTN_API_KEY=your-mtn-sandbox-api-key
MTN_ENVIRONMENT=sandbox
```

### Airtel Money API
```env
AIRTEL_MOBILE_MONEY_API_URL=https://openapiuat.airtel.africa
AIRTEL_API_KEY=your-airtel-sandbox-api-key
AIRTEL_CLIENT_ID=your-airtel-client-id
AIRTEL_CLIENT_SECRET=your-airtel-client-secret
```

## MTN Mobile Money Setup

### 1. Register for MTN Developer Account
1. Visit [MTN Developer Portal](https://momodeveloper.mtn.com/)
2. Create an account and register your application
3. Get your API key and subscription key

### 2. API Configuration
- **Sandbox URL**: `https://sandbox.momodeveloper.mtn.com`
- **Production URL**: `https://api.mtn.com` (when ready for production)
- **Environment**: Set to `sandbox` for testing, `production` for live

### 3. Required Headers
```javascript
{
  'Authorization': 'Bearer YOUR_API_KEY',
  'Content-Type': 'application/json',
  'X-Target-Environment': 'sandbox', // or 'production'
  'X-Reference-Id': 'unique-transaction-id'
}
```

## Airtel Money Setup

### 1. Register for Airtel Developer Account
1. Visit [Airtel Developer Portal](https://developer.airtel.africa/)
2. Create an account and register your application
3. Get your client ID, client secret, and API key

### 2. API Configuration
- **Sandbox URL**: `https://openapiuat.airtel.africa`
- **Production URL**: `https://openapi.airtel.africa` (when ready for production)

### 3. Authentication Flow
1. First, get an access token using client credentials
2. Use the access token for API calls

## Testing the Integration

### 1. Start the Backend Server
```bash
cd space-rent-be
npm start
```

### 2. Test Payment Methods Endpoint
```bash
curl -X GET "http://localhost:4000/api/payments/methods"
```

### 3. Test Mobile Money Payment
```bash
curl -X POST "http://localhost:4000/api/payments/mobile-money/initiate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "bookingId": "BOOKING_ID",
    "paymentMethod": "mobile_money_mtn",
    "mobileMoneyPhone": "256700000000"
  }'
```

## Production Considerations

### 1. Security
- Store API keys securely (use environment variables)
- Never commit API keys to version control
- Use HTTPS for all API calls
- Implement proper error handling and logging

### 2. Error Handling
- Network timeouts
- Invalid phone numbers
- Insufficient balance
- API rate limits
- Transaction failures

### 3. Monitoring
- Log all payment attempts
- Monitor API response times
- Track success/failure rates
- Set up alerts for failures

## Phone Number Formats

The system accepts phone numbers in these formats:
- **International**: `256700000000` (Uganda)
- **Local**: `0700000000` (automatically converted to international)

## Feature Flags

Mobile money payments are controlled by the `enable_mobile_money_payments` feature flag:

1. **Enable via Admin Panel**: Go to `/admin/feature-flags`
2. **Enable via API**: 
   ```bash
   curl -X PATCH "http://localhost:4000/api/feature-flags/FLAG_ID/toggle" \
     -H "Authorization: Bearer ADMIN_JWT_TOKEN"
   ```

## Troubleshooting

### Common Issues
1. **Invalid API Key**: Check your API key in the environment variables
2. **Phone Number Format**: Ensure phone numbers are in correct format
3. **Network Issues**: Check internet connection and API endpoints
4. **Authentication**: Verify JWT token is valid and user is authenticated

### Debug Mode
Enable debug logging by setting `NODE_ENV=development` in your `.env` file.

## Support

For API-specific issues:
- **MTN**: [MTN Developer Support](https://momodeveloper.mtn.com/support)
- **Airtel**: [Airtel Developer Support](https://developer.airtel.africa/support)

For application issues, check the application logs and error messages.
