# Postman Request Bodies for Auth & Users Endpoints

## Base URL
```
http://localhost:3000
```

## Authentication Endpoints

### 1. Register User
**POST** `/auth/register`
**No Auth Required**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe",
  "estate_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

---

### 2. Verify OTP
**POST** `/auth/verify-otp`
**No Auth Required**

```json
{
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "otp": "123456"
}
```

---

### 3. Login
**POST** `/auth/login`
**No Auth Required**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

---

### 4. Refresh Token
**POST** `/auth/refresh`
**No Auth Required**

```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 5. Change Password
**POST** `/auth/change-password`
**Auth Required: Bearer Token**

```json
{
  "old_password": "oldpassword123",
  "new_password": "newpassword123"
}
```

---

### 6. Request Password Reset
**POST** `/auth/request-password-reset`
**No Auth Required**

```json
{
  "email": "user@example.com"
}
```

---

### 7. Reset Password
**POST** `/auth/reset-password`
**No Auth Required**

```json
{
  "email": "user@example.com",
  "otp": "123456",
  "new_password": "newpassword123"
}
```

---

## User Endpoints

### 8. Get Current User Profile
**GET** `/users/me`
**Auth Required: Bearer Token**
**No Body Required**

---

### 9. Update User Profile
**PUT** `/users/me/profile`
**Auth Required: Bearer Token**

```json
{
  "phone_number": "+2348012345678",
  "apartment_type": "2-Bedroom",
  "house_address": "Block A, Apartment 101",
  "profile_picture_url": "https://example.com/profile.jpg"
}
```

**Note:** All fields are optional. You can send only the fields you want to update.

**Apartment Type Options:**
- `"Studio"`
- `"1-Bedroom"`
- `"2-Bedroom"`
- `"3-Bedroom"`
- `"4-Bedroom"`
- `"Penthouse"`
- `"Duplex"`

**Example - Update only phone number:**
```json
{
  "phone_number": "+2348012345678"
}
```

**Example - Update only apartment type:**
```json
{
  "apartment_type": "3-Bedroom"
}
```

---

### 10. Register Device for Push Notifications
**POST** `/users/me/devices`
**Auth Required: Bearer Token**

```json
{
  "token": "fcm_token_or_apns_token_here",
  "platform": "android",
  "device_id": "device_unique_id_123"
}
```

**Platform Options:**
- `"android"`
- `"ios"`
- `"web"`

**Example - iOS device:**
```json
{
  "token": "apns_token_here",
  "platform": "ios",
  "device_id": "iPhone_12345"
}
```

**Example - Web device (device_id optional):**
```json
{
  "token": "web_push_token_here",
  "platform": "web"
}
```

---

### 11. Unregister Device
**DELETE** `/users/me/devices/:token`
**Auth Required: Bearer Token**
**No Body Required**

**URL Parameter:** Replace `:token` with the actual device token

---

### 12. Get User Devices
**GET** `/users/me/devices`
**Auth Required: Bearer Token**
**No Body Required**

---

### 13. Search Users
**GET** `/users/search?query=john&estate_id=123e4567-e89b-12d3-a456-426614174000`
**Auth Required: Bearer Token**
**No Body Required**

**Query Parameters:**
- `query` (required): Search term
- `estate_id` (optional): Filter by estate UUID

**Example URLs:**
```
/users/search?query=john
/users/search?query=doe&estate_id=123e4567-e89b-12d3-a456-426614174000
```

---

### 14. Get User by ID
**GET** `/users/:id`
**Auth Required: Bearer Token**
**No Body Required**

**URL Parameter:** Replace `:id` with the user UUID

---

### 15. Update User Status
**PUT** `/users/:id/status`
**Auth Required: Bearer Token + Admin/Super Admin Role**

```json
{
  "status": "active"
}
```

**Status Options:**
- `"pending"`
- `"active"`
- `"suspended"`

**Example - Suspend user:**
```json
{
  "status": "suspended"
}
```

---

### 16. Activate User
**PUT** `/users/:id/activate`
**Auth Required: Bearer Token + Admin/Super Admin Role**
**No Body Required**

**URL Parameter:** Replace `:id` with the user UUID

---

### 17. Suspend User
**PUT** `/users/:id/suspend`
**Auth Required: Bearer Token + Admin/Super Admin Role**
**No Body Required**

**URL Parameter:** Replace `:id` with the user UUID

---

### 18. Get Users by Estate
**GET** `/users/estate/:estateId?page=1&limit=20`
**Auth Required: Bearer Token + Admin/Security/Super Admin Role**
**No Body Required**

**URL Parameter:** Replace `:estateId` with the estate UUID

**Query Parameters (optional):**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Example URLs:**
```
/users/estate/123e4567-e89b-12d3-a456-426614174000
/users/estate/123e4567-e89b-12d3-a456-426614174000?page=2&limit=10
```

---

### 19. Assign Estate to User
**PUT** `/users/:id/assign-estate`
**Auth Required: Bearer Token + Admin/Super Admin Role**

```json
{
  "estate_id": "123e4567-e89b-12d3-a456-426614174000",
  "role": "Residence",
  "apartment_type": "2-Bedroom",
  "house_address": "Block A, Apartment 101",
  "phone_number": "+2348012345678"
}
```

**Role Options:**
- `"Residence"`
- `"Security Personnel"`
- `"Admin"`
- `"Super Admin"`

**Apartment Type Options:**
- `"Studio"`
- `"1-Bedroom"`
- `"2-Bedroom"`
- `"3-Bedroom"`
- `"4-Bedroom"`
- `"Penthouse"`
- `"Duplex"`

**Note:** `estate_id` and `role` are required. Other fields are optional.

**Example - Assign with minimal data:**
```json
{
  "estate_id": "123e4567-e89b-12d3-a456-426614174000",
  "role": "Residence"
}
```

**Example - Assign Security Personnel:**
```json
{
  "estate_id": "123e4567-e89b-12d3-a456-426614174000",
  "role": "Security Personnel",
  "phone_number": "+2348012345678"
}
```

---

### 20. Make User Estate Admin
**PUT** `/users/:id/make-admin`
**Auth Required: Bearer Token + Super Admin Role**

```json
{
  "estate_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

**URL Parameter:** Replace `:id` with the user UUID

---

### 21. Make User Super Admin
**PUT** `/users/:id/make-super-admin`
**Auth Required: Bearer Token + Super Admin Role**

```json
{
  "confirm": true
}
```

**URL Parameter:** Replace `:id` with the user UUID

**Note:** `confirm` must be `true` to proceed with the action.

---

## Postman Setup Tips

### 1. Setting Bearer Token
1. Go to the **Authorization** tab in Postman
2. Select **Type: Bearer Token**
3. Paste your token in the **Token** field

### 2. Environment Variables
Create environment variables for:
- `base_url`: `http://localhost:3000`
- `access_token`: Your JWT access token
- `refresh_token`: Your refresh token
- `user_id`: User UUID
- `estate_id`: Estate UUID

Then use them like: `{{base_url}}/auth/login`

### 3. Headers
For endpoints requiring authentication, add:
```
Authorization: Bearer {{access_token}}
```

### 4. Content-Type
All POST/PUT requests should have:
```
Content-Type: application/json
```

---

## Complete Flow Example

### Step 1: Register
```json
POST {{base_url}}/auth/register
{
  "email": "newuser@example.com",
  "password": "password123",
  "first_name": "Jane",
  "last_name": "Smith",
  "estate_id": "{{estate_id}}"
}
```
**Response:** `{ "message": "...", "user_id": "..." }`

### Step 2: Verify OTP
```json
POST {{base_url}}/auth/verify-otp
{
  "user_id": "{{user_id}}",
  "otp": "123456"
}
```

### Step 3: Login (after admin activates account)
```json
POST {{base_url}}/auth/login
{
  "email": "newuser@example.com",
  "password": "password123"
}
```
**Response:** `{ "access_token": "...", "refresh_token": "...", "user": {...} }`

### Step 4: Update Profile
```json
PUT {{base_url}}/users/me/profile
Authorization: Bearer {{access_token}}
{
  "phone_number": "+2348012345678",
  "apartment_type": "2-Bedroom",
  "house_address": "Block A, Apt 101"
}
```

### Step 5: Register Device
```json
POST {{base_url}}/users/me/devices
Authorization: Bearer {{access_token}}
{
  "token": "fcm_token_here",
  "platform": "android",
  "device_id": "device_123"
}
```

---

## Common Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Validation error message",
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "User not found",
  "error": "Not Found"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden"
}
```

---

## Estate Endpoints

### 22. Create Estate
**POST** `/estates`
**Auth Required: Bearer Token + Admin/Super Admin Role**

```json
{
  "name": "Sunset Gardens Estate",
  "email": "info@sunsetgardens.com",
  "address": "123 Main Street, Lagos, Nigeria"
}
```

**Required Fields:**
- `name`: Estate name (string, min 1 character)
- `email`: Estate email (valid email format)
- `address`: Estate address (string, min 1 character)

---

### 23. Get All Estates
**GET** `/estates?page=1&limit=20`
**Auth Required: Bearer Token**
**No Body Required**

**Query Parameters (optional):**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Example URLs:**
```
/estates
/estates?page=1&limit=20
/estates?page=2&limit=10
```

---

### 24. Search Estates
**GET** `/estates/search?query=sunset`
**Auth Required: Bearer Token**
**No Body Required**

**Query Parameters:**
- `query` (required): Search term (searches in name and address)

**Example URLs:**
```
/estates/search?query=sunset
/estates/search?query=lagos
/estates/search?query=garden
```

---

### 25. Get Estate by ID
**GET** `/estates/:id`
**Auth Required: Bearer Token**
**No Body Required**

**URL Parameter:** Replace `:id` with the estate UUID

**Example:**
```
/estates/123e4567-e89b-12d3-a456-426614174000
```

---

### 26. Update Estate
**PUT** `/estates/:id`
**Auth Required: Bearer Token + Admin/Super Admin Role**

```json
{
  "name": "Sunset Gardens Estate Updated",
  "email": "contact@sunsetgardens.com",
  "address": "123 Main Street, Victoria Island, Lagos, Nigeria"
}
```

**Note:** All fields are optional. You can send only the fields you want to update.

**Example - Update only name:**
```json
{
  "name": "Sunset Gardens Estate - New Name"
}
```

**Example - Update only email:**
```json
{
  "email": "newemail@sunsetgardens.com"
}
```

**Example - Update only address:**
```json
{
  "address": "456 New Street, Lekki, Lagos, Nigeria"
}
```

**Example - Update multiple fields:**
```json
{
  "name": "Sunset Gardens Estate",
  "email": "info@sunsetgardens.com",
  "address": "789 Updated Street, Lagos, Nigeria"
}
```

---

### 27. Delete Estate
**DELETE** `/estates/:id`
**Auth Required: Bearer Token + Admin/Super Admin Role**
**No Body Required**

**URL Parameter:** Replace `:id` with the estate UUID

**Example:**
```
DELETE /estates/123e4567-e89b-12d3-a456-426614174000
```

---

## Estate Endpoints Summary

| Endpoint | Method | Auth Required | Role Required | Body Required |
|----------|--------|---------------|---------------|---------------|
| Create Estate | POST | Yes | Admin/Super Admin | Yes |
| Get All Estates | GET | Yes | None | No |
| Search Estates | GET | Yes | None | No |
| Get Estate by ID | GET | Yes | None | No |
| Update Estate | PUT | Yes | Admin/Super Admin | Yes (optional fields) |
| Delete Estate | DELETE | Yes | Admin/Super Admin | No |

---

## Estate Complete Flow Example

### Step 1: Create Estate (Admin/Super Admin)
```json
POST {{base_url}}/estates
Authorization: Bearer {{admin_access_token}}
{
  "name": "Green Valley Estate",
  "email": "info@greenvalley.com",
  "address": "100 Estate Road, Abuja, Nigeria"
}
```
**Response:** `{ "estate_id": "...", "name": "...", "email": "...", "address": "...", ... }`

### Step 2: Get All Estates
```
GET {{base_url}}/estates?page=1&limit=20
Authorization: Bearer {{access_token}}
```

### Step 3: Search Estates
```
GET {{base_url}}/estates/search?query=green
Authorization: Bearer {{access_token}}
```

### Step 4: Get Estate by ID
```
GET {{base_url}}/estates/{{estate_id}}
Authorization: Bearer {{access_token}}
```

### Step 5: Update Estate (Admin/Super Admin)
```json
PUT {{base_url}}/estates/{{estate_id}}
Authorization: Bearer {{admin_access_token}}
{
  "name": "Green Valley Estate - Updated",
  "email": "contact@greenvalley.com"
}
```

### Step 6: Delete Estate (Admin/Super Admin)
```
DELETE {{base_url}}/estates/{{estate_id}}
Authorization: Bearer {{admin_access_token}}
```

---

## Estate Error Responses

### 400 Bad Request - Validation Error
```json
{
  "statusCode": 400,
  "message": [
    "name should not be empty",
    "email must be an email"
  ],
  "error": "Bad Request"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Estate not found",
  "error": "Not Found"
}
```

### 403 Forbidden - Insufficient Permissions
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden"
}
```

---

## Notes for Estate Endpoints

1. **Create Estate**: Only Admin and Super Admin can create estates. The estate_id is auto-generated as a UUID.

2. **Update Estate**: All fields are optional. You can update one, two, or all three fields at once.

3. **Delete Estate**: This is a permanent action. Make sure you want to delete the estate before proceeding.

4. **Search**: The search endpoint searches in both `name` and `address` fields using case-insensitive matching.

5. **Pagination**: The `getAllEstates` endpoint supports pagination with `page` and `limit` query parameters.

6. **Relationships**: Estates are related to:
   - Users (through user_profiles)
   - Lost & Found Items
   - Service Providers
   - Utility Accounts
   - Conversations
   - Reports

