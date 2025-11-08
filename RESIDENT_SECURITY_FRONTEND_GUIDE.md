# Resident & Security Frontend Integration Guide

**For Flutter Developers**

This guide provides complete API integration examples for Resident and Security Personnel operations in the Vaultify system. All examples use Postman-style request/response formats for easy Flutter integration.

---

## Table of Contents

1. [Authentication & Registration](#1-authentication--registration)
2. [Access Codes](#2-access-codes)
3. [Alerts](#3-alerts)
4. [Lost & Found](#4-lost--found)
5. [Service Charges](#5-service-charges)
6. [Service Providers](#6-service-providers)
7. [Wallet Operations](#7-wallet-operations)
8. [Subscriptions](#8-subscriptions)
9. [Announcements](#9-announcements)
10. [Flutter Integration Examples](#10-flutter-integration-examples)

---

## 1. Authentication & Registration

### Base URL
```
https://your-api-domain.com/api
```
 
### Headers Required
All authenticated requests require:
```dart
{
  "Authorization": "Bearer {access_token}",
  "Content-Type": "application/json"
}
```

### 1.1 Register New User
**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "email": "resident@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe",
  "estate_id": "estate-uuid-paradise"
}
```

**Response:**
```json
{
  "message": "Registration successful. Please check your email for verification code.",
  "user_id": "user-uuid"
}
```

**Flutter Example:**
```dart
Future<Map<String, dynamic>> register({
  required String email,
  required String password,
  required String firstName,
  required String lastName,
  required String estateId,
}) async {
  final response = await http.post(
    Uri.parse('$baseUrl/auth/register'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
      'email': email,
      'password': password,
      'first_name': firstName,
      'last_name': lastName,
      'estate_id': estateId,
    }),
  );
  
  if (response.statusCode == 201) {
    return jsonDecode(response.body);
  } else {
    throw Exception('Registration failed: ${response.body}');
  }
}
```

### 1.2 Verify OTP
**Endpoint:** `POST /auth/verify-otp`

**Request Body:**
```json
{
  "user_id": "user-uuid",
  "otp": "123456"
}
```

**Response:**
```json
{
  "message": "Email verified successfully. Please wait for admin approval to activate your account.",
  "user_id": "user-uuid",
  "status": "pending"
}
```

**Note:** After OTP verification, user status remains `pending` until admin activates them.

### 1.3 Login
**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "resident@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "refresh_token_here",
  "user": {
    "user_id": "user-uuid",
    "email": "resident@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "status": "active",
    "profile": {
      "estate_id": "estate-uuid-paradise",
      "role": "Residence"
    }
  }
}
```

**Flutter Example:**
```dart
Future<Map<String, dynamic>> login(String email, String password) async {
  final response = await http.post(
    Uri.parse('$baseUrl/auth/login'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
      'email': email,
      'password': password,
    }),
  );
  
  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    // Store tokens
    await storage.write(key: 'access_token', value: data['access_token']);
    await storage.write(key: 'refresh_token', value: data['refresh_token']);
    return data;
  } else {
    throw Exception('Login failed: ${response.body}');
  }
}
```

### 1.4 Get Current User Profile
**Endpoint:** `GET /users/me`

**Response:**
```json
{
  "user_id": "user-uuid",
  "email": "resident@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "status": "active",
  "profile": {
    "user_id": "user-uuid",
    "estate_id": "estate-uuid",
    "role": "Residence",
    "apartment_type": "2-Bedroom",
    "house_address": "Block A, Flat 101",
    "phone_number": "+2348012345678",
    "isSubscribe": true,
    "subscription_start_date": "2024-01-15T10:00:00Z",
    "subscription_expiry_date": "2024-02-15T10:00:00Z"
  },
  "wallet": {
    "wallet_id": "wallet-uuid",
    "available_balance": 5000.00
  },
  "active_subscription": {
    "subscription_id": "sub-uuid",
    "status": "active",
    "end_date": "2024-02-15T10:00:00Z"
  }
}
```

### 1.5 Update Profile
**Endpoint:** `PUT /users/me/profile`

**Request Body:**
```json
{
  "phone_number": "+2348012345678",
  "apartment_type": "2-Bedroom",
  "house_address": "Block A, Flat 101",
  "profile_picture_url": "https://storage.example.com/profile.jpg"
}
```

**Apartment Types:**
- `Studio`
- `1-Bedroom`
- `2-Bedroom`
- `3-Bedroom`
- `4-Bedroom`
- `5-Bedroom`
- `Duplex`

**Response:**
```json
{
  "user_id": "user-uuid",
  "phone_number": "+2348012345678",
  "apartment_type": "2-Bedroom",
  "house_address": "Block A, Flat 101",
  "profile_picture_url": "https://storage.example.com/profile.jpg"
}
```

---

## 2. Access Codes

### 2.1 Create Access Code (Residents Only)
**Endpoint:** `POST /access-codes`

**Access:** Residents only

**Request Body:**
```json
{
  "visitor_name": "Jane Smith",
  "visitor_email": "jane@example.com",
  "visitor_phone": "+2348012345678",
  "valid_from": "2024-01-15T10:00:00Z",
  "valid_to": "2024-01-15T18:00:00Z",
  "max_uses": 5,
  "gate": "Main Gate",
  "notify_on_use": true
}
```

**Response:**
```json
{
  "code": "ABC12345",
  "visitor_name": "Jane Smith",
  "visitor_email": "jane@example.com",
  "visitor_phone": "+2348012345678",
  "valid_from": "2024-01-15T10:00:00Z",
  "valid_to": "2024-01-15T18:00:00Z",
  "max_uses": 5,
  "current_uses": 0,
  "gate": "Main Gate",
  "is_active": true,
  "notify_on_use": true,
  "created_at": "2024-01-15T09:00:00Z",
  "creator_house_address": "Block A, Flat 101"
}
```

**Note:** `creator_house_address` is automatically included from resident's profile.

**Flutter Example:**
```dart
Future<Map<String, dynamic>> createAccessCode({
  required String visitorName,
  String? visitorEmail,
  String? visitorPhone,
  required DateTime validFrom,
  required DateTime validTo,
  int maxUses = 1,
  String? gate,
  bool notifyOnUse = true,
}) async {
  final token = await storage.read(key: 'access_token');
  final response = await http.post(
    Uri.parse('$baseUrl/access-codes'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
    body: jsonEncode({
      'visitor_name': visitorName,
      'visitor_email': visitorEmail,
      'visitor_phone': visitorPhone,
      'valid_from': validFrom.toIso8601String(),
      'valid_to': validTo.toIso8601String(),
      'max_uses': maxUses,
      'gate': gate,
      'notify_on_use': notifyOnUse,
    }),
  );
  
  if (response.statusCode == 201) {
    return jsonDecode(response.body);
  } else {
    throw Exception('Failed to create access code: ${response.body}');
  }
}
```

### 2.2 Get My Access Codes (Residents)
**Endpoint:** `GET /access-codes`

**Access:** Residents only

**Response:**
```json
[
  {
    "code": "ABC12345",
    "visitor_name": "Jane Smith",
    "visitor_email": "jane@example.com",
    "visitor_phone": "+2348012345678",
    "valid_from": "2024-01-15T10:00:00Z",
    "valid_to": "2024-01-15T18:00:00Z",
    "max_uses": 5,
    "current_uses": 0,
    "gate": "Main Gate",
    "is_active": true,
    "creator_house_address": "Block A, Flat 101",
    "created_at": "2024-01-15T09:00:00Z"
  }
]
```

### 2.3 Deactivate Access Code (Residents)
**Endpoint:** `PUT /access-codes/{code}/deactivate`

**Access:** Residents only (only the creator can deactivate)

**Request Body:** None (empty body)

**Response:**
```json
{
  "message": "Access code deactivated successfully"
}
```

### 2.4 Validate Access Code (Security Personnel Only)
**Endpoint:** `POST /access-codes/validate/{code}`

**Access:** Security Personnel only

**Response (If Valid):**
```json
{
  "code": "ABC12345",
  "visitor_name": "Jane Smith",
  "visitor_email": "jane@example.com",
  "visitor_phone": "+2348012345678",
  "creator_name": "John Doe",
  "creator_house_address": "Block A, Flat 101",
  "valid_from": "2024-01-15T10:00:00Z",
  "valid_to": "2024-01-15T18:00:00Z",
  "remaining_uses": 4
}
```

**Response (If Invalid/Expired):**
```json
{
  "statusCode": 400,
  "message": "Access code has expired"
}
```

**Important:** 
- Security can only verify codes from their estate
- Cross-estate verification is automatically blocked
- `creator_house_address` helps direct visitors to correct location

**Flutter Example:**
```dart
Future<Map<String, dynamic>> validateAccessCode(String code) async {
  final token = await storage.read(key: 'access_token');
  final response = await http.post(
    Uri.parse('$baseUrl/access-codes/validate/$code'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
  );
  
  if (response.statusCode == 200) {
    return jsonDecode(response.body);
  } else {
    final error = jsonDecode(response.body);
    throw Exception(error['message'] ?? 'Invalid access code');
  }
}
```

---

## 3. Alerts

### 3.1 Create Alert (All Users)
**Endpoint:** `POST /alerts`

**Access:** All authenticated users (Residents, Admins, Security)

**Request Body (Send to All Estate Residents):**
```json
{
  "message": "Road block on Main Street due to maintenance work. Please use alternative route.",
  "alert_type": "maintenance",
  "urgency_level": "high",
  "recipients": {
    "type": "estate"
  }
}
```

**Request Body (Send to Specific Users):**
```json
{
  "message": "Your package has arrived at the reception",
  "alert_type": "general",
  "urgency_level": "medium",
  "recipients": {
    "type": "user",
    "user_ids": ["user-uuid-1", "user-uuid-2"]
  }
}
```

**Alert Types:**
- `general`
- `emergency`
- `maintenance`
- `security`
- `utility`

**Urgency Levels:**
- `low`
- `medium`
- `high`
- `critical`

**Response:**
```json
{
  "alert_id": "alert-uuid",
  "sender_user_id": "resident-uuid",
  "message": "Road block on Main Street due to maintenance work. Please use alternative route.",
  "alert_type": "maintenance",
  "urgency_level": "high",
  "recipients": {
    "type": "estate",
    "estate_id": "estate-uuid-paradise"
  },
  "timestamp": "2024-01-15T10:00:00Z"
}
```

**Note:** When `recipients.type` is `"estate"`, system automatically uses sender's estate. Residents cannot send alerts to other estates.

**Flutter Example:**
```dart
Future<Map<String, dynamic>> createAlert({
  required String message,
  required String alertType,
  required String urgencyLevel,
  String recipientType = 'estate',
  List<String>? userIds,
}) async {
  final token = await storage.read(key: 'access_token');
  final Map<String, dynamic> recipients;
  
  if (recipientType == 'user' && userIds != null) {
    recipients = {
      'type': 'user',
      'user_ids': userIds,
    };
  } else {
    recipients = {'type': 'estate'};
  }
  
  final response = await http.post(
    Uri.parse('$baseUrl/alerts'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
    body: jsonEncode({
      'message': message,
      'alert_type': alertType,
      'urgency_level': urgencyLevel,
      'recipients': recipients,
    }),
  );
  
  if (response.statusCode == 201) {
    return jsonDecode(response.body);
  } else {
    throw Exception('Failed to create alert: ${response.body}');
  }
}
```

### 3.2 Get My Alerts
**Endpoint:** `GET /alerts/me?page=1&limit=20`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "data": [
    {
      "alert_id": "alert-uuid",
      "message": "Road block on Main Street due to maintenance work...",
      "alert_type": "maintenance",
      "urgency_level": "high",
      "sender": {
        "first_name": "John",
        "last_name": "Doe"
      },
      "timestamp": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 20
}
```

### 3.3 Get Alert by ID
**Endpoint:** `GET /alerts/{alertId}`

**Response:**
```json
{
  "alert_id": "alert-uuid",
  "message": "Road block on Main Street...",
  "alert_type": "maintenance",
  "urgency_level": "high",
  "sender": {
    "first_name": "John",
    "last_name": "Doe"
  },
  "timestamp": "2024-01-15T10:00:00Z"
}
```

### 3.4 Update Alert (Only Sender)
**Endpoint:** `PUT /alerts/{alertId}`

**Access:** Only the sender can update

**Request Body:**
```json
{
  "message": "Updated: Road block cleared. Traffic is flowing normally now.",
  "urgency_level": "low"
}
```

**Response:**
```json
{
  "alert_id": "alert-uuid",
  "message": "Updated: Road block cleared. Traffic is flowing normally now.",
  "urgency_level": "low",
  "updated_at": "2024-01-15T11:00:00Z"
}
```

### 3.5 Delete Alert
**Endpoint:** `DELETE /alerts/{alertId}`

**Access:** All users (removes from their view)

**Request Body:**
```json
{
  "reason": "Already resolved"
}
```

**Response:**
```json
{
  "message": "Alert deleted successfully"
}
```

---

## 4. Lost & Found

### 4.1 Report Lost Item
**Endpoint:** `POST /lost-found`

**Request Body:**
```json
{
  "estate_id": "estate-uuid-paradise",
  "description": "Lost black iPhone 13 Pro Max with blue case",
  "item_type": "Lost",
  "location": "Near the swimming pool",
  "contact_info": "+2348012345678",
  "image_url": "https://storage.example.com/lost-phone.jpg"
}
```

**Item Types:**
- `Lost`
- `Found`

**Response:**
```json
{
  "lostfound_id": "item-uuid",
  "sender_user_id": "user-uuid",
  "estate_id": "estate-uuid-paradise",
  "description": "Lost black iPhone 13 Pro Max with blue case",
  "item_type": "Lost",
  "location": "Near the swimming pool",
  "contact_info": "+2348012345678",
  "image_url": "https://storage.example.com/lost-phone.jpg",
  "date_reported": "2024-01-15T10:00:00Z"
}
```

**Note:** `estate_id` must match user's estate. System validates this automatically.

**Flutter Example:**
```dart
Future<Map<String, dynamic>> reportLostFound({
  required String estateId,
  required String description,
  required String itemType, // "Lost" or "Found"
  String? location,
  String? contactInfo,
  String? imageUrl,
}) async {
  final token = await storage.read(key: 'access_token');
  final response = await http.post(
    Uri.parse('$baseUrl/lost-found'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
    body: jsonEncode({
      'estate_id': estateId,
      'description': description,
      'item_type': itemType,
      'location': location,
      'contact_info': contactInfo,
      'image_url': imageUrl,
    }),
  );
  
  if (response.statusCode == 201) {
    return jsonDecode(response.body);
  } else {
    throw Exception('Failed to report item: ${response.body}');
  }
}
```

### 4.2 Report Found Item
**Endpoint:** `POST /lost-found`

**Request Body:**
```json
{
  "estate_id": "estate-uuid-paradise",
  "description": "Found a set of keys with a keychain",
  "item_type": "Found",
  "location": "Parking lot",
  "contact_info": "+2348012345678",
  "image_url": "https://storage.example.com/found-keys.jpg"
}
```

### 4.3 Get Items by Estate
**Endpoint:** `GET /lost-found/estate/{estateId}?page=1&limit=20`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "data": [
    {
      "lostfound_id": "item-uuid",
      "description": "Lost black iPhone 13 Pro Max with blue case",
      "item_type": "Lost",
      "location": "Near the swimming pool",
      "contact_info": "+2348012345678",
      "image_url": "https://storage.example.com/lost-phone.jpg",
      "date_reported": "2024-01-15T10:00:00Z",
      "sender": {
        "user_id": "user-uuid",
        "first_name": "John",
        "last_name": "Doe"
      }
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

### 4.4 Search Items
**Endpoint:** `GET /lost-found/search/{estateId}?query=iphone&page=1&limit=20`

**Query Parameters:**
- `query` (required): Search term
- `item_type` (optional): Filter by "Lost" or "Found"
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response:** Same format as above

### 4.5 Get Item by ID
**Endpoint:** `GET /lost-found/{itemId}`

**Response:** Single item object (same format as above)

### 4.6 Update Item
**Endpoint:** `PUT /lost-found/{itemId}`

**Access:** Only the reporter can update

**Request Body:**
```json
{
  "description": "Updated description",
  "location": "Updated location",
  "contact_info": "+2348098765432"
}
```

### 4.7 Delete Item
**Endpoint:** `DELETE /lost-found/{itemId}`

**Access:** Only the reporter can delete

**Response:**
```json
{
  "message": "Item deleted successfully"
}
```

---

## 5. Service Charges

### 5.1 Create Service Charge Record
**Endpoint:** `POST /bank-service-charges`

**Request Body:**
```json
{
  "service_charge": 50000,
  "payment_frequency": "monthly",
  "bank_name": "Access Bank",
  "account_name": "Paradise Estate",
  "account_number": "1234567890"
}
```

**Payment Frequencies:**
- `monthly`
- `quarterly`
- `yearly`

**Response:**
```json
{
  "bsc_id": "bsc-uuid",
  "user_id": "user-uuid",
  "service_charge": 50000,
  "paid_charge": 0,
  "outstanding_charge": 50000,
  "payment_frequency": "monthly",
  "bank_name": "Access Bank",
  "account_name": "Paradise Estate",
  "account_number": "1234567890",
  "is_validated": false,
  "created_at": "2024-01-15T10:00:00Z"
}
```

**Note:** Each user can only have ONE service charge record.

### 5.2 Get My Service Charge
**Endpoint:** `GET /bank-service-charges/me`

**Response:**
```json
{
  "bsc_id": "bsc-uuid",
  "service_charge": 50000,
  "paid_charge": 20000,
  "outstanding_charge": 30000,
  "payment_frequency": "monthly",
  "bank_name": "Access Bank",
  "account_name": "Paradise Estate",
  "account_number": "1234567890",
  "is_validated": false,
  "files": [
    {
      "bsc_file_id": "file-uuid",
      "file_url": "https://storage.example.com/receipt.pdf",
      "uploaded_at": "2024-01-15T11:00:00Z"
    }
  ]
}
```

### 5.3 Update Service Charge (Bank Details Only)
**Endpoint:** `PUT /bank-service-charges/me`

**Request Body:**
```json
{
  "payment_frequency": "quarterly",
  "bank_name": "GTBank",
  "account_name": "Paradise Estate",
  "account_number": "9876543210"
}
```

**Note:** Users can only update bank details. Payment amounts (`service_charge`, `paid_charge`) can only be updated by admins.

**Response:**
```json
{
  "bsc_id": "bsc-uuid",
  "payment_frequency": "quarterly",
  "bank_name": "GTBank",
  "account_name": "Paradise Estate",
  "account_number": "9876543210"
}
```

### 5.4 Upload Payment Receipt
**Endpoint:** `POST /bank-service-charges/me/files`

**Request Body:**
```json
{
  "file_url": "https://storage.example.com/bank-receipt.pdf"
}
```

**Response:**
```json
{
  "bsc_file_id": "file-uuid",
  "bsc_id": "bsc-uuid",
  "file_url": "https://storage.example.com/bank-receipt.pdf",
  "uploaded_at": "2024-01-15T11:00:00Z"
}
```

**Important:** 
- Users can only upload receipts/images
- Payment amounts are updated by admins only
- Upload receipt first, then admin reviews and updates `paid_charge`

**Flutter Example:**
```dart
Future<Map<String, dynamic>> uploadReceipt(String fileUrl) async {
  final token = await storage.read(key: 'access_token');
  final response = await http.post(
    Uri.parse('$baseUrl/bank-service-charges/me/files'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
    body: jsonEncode({
      'file_url': fileUrl,
    }),
  );
  
  if (response.statusCode == 201) {
    return jsonDecode(response.body);
  } else {
    throw Exception('Failed to upload receipt: ${response.body}');
  }
}
```

### 5.5 Get My Service Charge Files
**Endpoint:** `GET /bank-service-charges/me/files`

**Response:**
```json
[
  {
    "bsc_file_id": "file-uuid",
    "file_url": "https://storage.example.com/receipt.pdf",
    "uploaded_at": "2024-01-15T11:00:00Z"
  }
]
```

### 5.6 Delete Service Charge File
**Endpoint:** `DELETE /bank-service-charges/me/files/{fileId}`

**Response:**
```json
{
  "message": "File deleted successfully"
}
```

---

## 6. Service Providers

### 6.1 Get Available Services
**Endpoint:** `GET /service-directory/services`

**Response:**
```json
{
  "data": [
    {
      "service_id": "service-uuid",
      "name": "Plumber"
    },
    {
      "service_id": "service-uuid-2",
      "name": "Electrician"
    },
    {
      "service_id": "service-uuid-3",
      "name": "Carpenter"
    }
  ]
}
```

### 6.2 Get Providers by Service
**Endpoint:** `GET /service-directory/providers/service/{serviceId}?estate_id={estateId}&page=1&limit=20`

**Query Parameters:**
- `serviceId` (required): Service ID
- `estate_id` (required): Estate ID
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response:**
```json
{
  "data": [
    {
      "provider_id": "provider-uuid",
      "first_name": "Michael",
      "last_name": "Adeyemi",
      "phone": "+2348012345678",
      "location": "Lagos",
      "availability": "Mon-Fri, 9 AM - 6 PM",
      "bio": "Experienced plumber with 10 years of experience",
      "skill": "Plumbing, Pipe Repair, Installation",
      "profile_picture_url": "https://storage.example.com/provider-photo.jpg",
      "service": {
        "service_id": "service-uuid",
        "name": "Plumber"
      },
      "photos": [
        {
          "provider_photo_id": "photo-uuid-1",
          "image_url": "https://storage.example.com/work-photo-1.jpg",
          "uploaded_at": "2024-01-15T10:00:00Z"
        }
      ],
      "reviews": [
        {
          "rating": 5,
          "comment": "Excellent service!",
          "reviewer_name": "John Doe"
        }
      ]
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

### 6.3 Search Providers
**Endpoint:** `GET /service-directory/providers/search?query=plumber&estate_id={estateId}`

**Query Parameters:**
- `query` (required): Search term
- `estate_id` (required): Estate ID

**Response:** Same format as above

### 6.4 Get Provider Details
**Endpoint:** `GET /service-directory/providers/{providerId}`

**Response:**
```json
{
  "provider_id": "provider-uuid",
  "first_name": "Michael",
  "last_name": "Adeyemi",
  "phone": "+2348012345678",
  "location": "Lagos",
  "availability": "Mon-Fri, 9 AM - 6 PM",
  "bio": "Experienced plumber with 10 years of experience",
  "skill": "Plumbing, Pipe Repair, Installation",
  "profile_picture_url": "https://storage.example.com/provider-photo.jpg",
  "service": {
    "service_id": "service-uuid",
    "name": "Plumber"
  },
  "photos": [
    {
      "provider_photo_id": "photo-uuid-1",
      "image_url": "https://storage.example.com/work-photo-1.jpg",
      "uploaded_at": "2024-01-15T10:00:00Z"
    }
  ],
  "reviews": [
    {
      "review_id": "review-uuid",
      "reviewer_name": "John Doe",
      "rating": 5,
      "comment": "Excellent service! Fixed my leaky faucet quickly.",
      "created_at": "2024-01-10T10:00:00Z"
    }
  ]
}
```

### 6.5 Leave Review
**Endpoint:** `POST /service-directory/providers/{providerId}/reviews`

**Request Body:**
```json
{
  "reviewer_name": "John Doe",
  "rating": 5,
  "comment": "Excellent service! Fixed my leaky faucet quickly."
}
```

**Response:**
```json
{
  "review_id": "review-uuid",
  "provider_id": "provider-uuid",
  "reviewer_name": "John Doe",
  "rating": 5,
  "comment": "Excellent service! Fixed my leaky faucet quickly.",
  "created_at": "2024-01-15T10:00:00Z"
}
```

**Note:** 
- Providers are registered by estate admins
- Residents can view, search, and contact providers
- Residents can leave reviews after service

---

## 7. Wallet Operations

### 7.1 Get Wallet Balance
**Endpoint:** `GET /wallets/me`

**Response:**
```json
{
  "wallet_id": "wallet-uuid",
  "user_id": "user-uuid",
  "available_balance": 5000.00,
  "created_at": "2024-01-01T00:00:00Z"
}
```

### 7.2 Top Up Wallet
**Endpoint:** `POST /wallets/topup`

**Request Body:**
```json
{
  "amount": 10000,
  "payment_method": "paystack"
}
```

**Payment Methods:**
- `paystack`
- `card`
- `transfer`

**Response:**
```json
{
  "payment_id": "payment-uuid",
  "reference": "TOPUP_abc123xyz",
  "amount": 10000,
  "status": "pending",
  "payment_url": "https://paystack.com/pay/TOPUP_abc123xyz"
}
```

**Flutter Example:**
```dart
Future<Map<String, dynamic>> topUpWallet({
  required double amount,
  String paymentMethod = 'paystack',
}) async {
  final token = await storage.read(key: 'access_token');
  final response = await http.post(
    Uri.parse('$baseUrl/wallets/topup'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
    body: jsonEncode({
      'amount': amount,
      'payment_method': paymentMethod,
    }),
  );
  
  if (response.statusCode == 201) {
    final data = jsonDecode(response.body);
    // Open payment URL in browser or WebView
    // await launchUrl(Uri.parse(data['payment_url']));
    return data;
  } else {
    throw Exception('Failed to initiate top-up: ${response.body}');
  }
}
```

### 7.3 Get Transaction History
**Endpoint:** `GET /wallets/me/transactions?page=1&limit=20`

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `purpose` (optional): Filter by purpose
- `direction` (optional): `credit` or `debit`
- `status` (optional): `pending`, `success`, or `failed`

**Response:**
```json
{
  "data": [
    {
      "wallet_txn_id": "txn-uuid",
      "wallet_id": "wallet-uuid",
      "amount": "10000.00",
      "direction": "CREDIT",
      "purpose": "TOP_UP",
      "reference": "TOPUP_abc123xyz",
      "status": "completed",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

**Transaction Purposes:**
- `TOP_UP`
- `TRANSFER`
- `WITHDRAWAL`
- `SERVICE_CHARGE_PAYMENT`
- `UTILITY_PAYMENT`
- `SUBSCRIPTION_PAYMENT`

### 7.4 Transfer to Another User
**Endpoint:** `POST /wallets/transfer`

**Request Body:**
```json
{
  "recipient_user_id": "recipient-uuid",
  "amount": 5000,
  "purpose": "Payment for services"
}
```

**Response:**
```json
{
  "wallet_txn_id": "txn-uuid",
  "reference": "TRANSFER_xyz789",
  "amount": 5000,
  "status": "completed"
}
```

**Note:** Minimum balance: ₦100. All transactions are atomic.

---

## 8. Subscriptions

### 8.1 Get Available Plans
**Endpoint:** `GET /subscriptions/plans`

**Response:**
```json
{
  "data": [
    {
      "plan_id": "plan-uuid-1",
      "code": "NORMAL_MONTHLY",
      "name": "Normal Monthly Plan",
      "type": "normal",
      "price_ngn": 5000,
      "billing_cycle": "monthly",
      "max_members": 1,
      "features": [
        "Access to all basic features",
        "Estate alerts",
        "Lost & Found",
        "Access codes"
      ]
    },
    {
      "plan_id": "plan-uuid-2",
      "code": "FAMILY_YEARLY",
      "name": "Family Yearly Plan",
      "type": "family",
      "price_ngn": 50000,
      "billing_cycle": "yearly",
      "max_members": 5,
      "features": [
        "Access to all features",
        "Up to 5 family members",
        "Priority support",
        "Advanced features"
      ]
    }
  ]
}
```

### 8.2 Activate Subscription (Wallet Payment)
**Endpoint:** `POST /subscriptions/activate`

**Request Body:**
```json
{
  "plan_id": "plan-uuid-1",
  "payment_method": "wallet"
}
```

**Response:**
```json
{
  "subscription": {
    "subscription_id": "sub-uuid",
    "user_id": "user-uuid",
    "plan_id": "plan-uuid-1",
    "status": "active",
    "start_date": "2024-01-15T10:00:00Z",
    "end_date": "2024-02-15T10:00:00Z",
    "is_family_member": false,
    "price_paid": 5000,
    "head_price": 5000
  },
  "payment": {
    "payment_id": "payment-uuid",
    "amount": 5000,
    "status": "success",
    "reference": "SUB_abc123"
  },
  "payment_url": null
}
```

**Note:** Wallet payments activate instantly. `isSubscribe` in profile is automatically set to `true`.

### 8.3 Activate Subscription (External Payment)
**Endpoint:** `POST /subscriptions/activate`

**Request Body:**
```json
{
  "plan_id": "plan-uuid-1",
  "payment_method": "external"
}
```

**Response:**
```json
{
  "subscription": {
    "subscription_id": "sub-uuid",
    "status": "pending",
    "start_date": "2024-01-15T10:00:00Z",
    "end_date": "2024-02-15T10:00:00Z"
  },
  "payment": {
    "payment_id": "payment-uuid",
    "amount": 5000,
    "status": "pending",
    "reference": "SUB_xyz789"
  },
  "payment_url": "https://paystack.com/pay/SUB_xyz789"
}
```

**Note:** External payments create pending subscription. Subscription activates when payment webhook confirms payment.

### 8.4 Get My Subscriptions
**Endpoint:** `GET /subscriptions/me`

**Response:**
```json
[
  {
    "subscription_id": "sub-uuid",
    "user_id": "user-uuid",
    "plan_id": "plan-uuid-1",
    "status": "active",
    "start_date": "2024-01-15T10:00:00Z",
    "end_date": "2024-02-15T10:00:00Z",
    "expired_date": null,
    "is_free_subscription": false,
    "granted_by_admin": null,
    "plan": {
      "plan_id": "plan-uuid-1",
      "name": "Normal Monthly Plan",
      "type": "normal",
      "price_ngn": 5000,
      "billing_cycle": "monthly"
    }
  }
]
```

### 8.5 Get Active Subscription
**Endpoint:** `GET /subscriptions/me/active`

**Response:**
```json
{
  "has_active_subscription": true,
  "subscription": {
    "subscription_id": "sub-uuid",
    "status": "active",
    "end_date": "2024-02-15T10:00:00Z"
  }
}
```

### 8.6 Renew Subscription
**Endpoint:** `PUT /subscriptions/renew`

**Request Body:**
```json
{
  "payment_method": "wallet"
}
```

**Response:**
```json
{
  "subscription": {
    "subscription_id": "sub-uuid",
    "status": "active",
    "start_date": "2024-02-15T10:00:00Z",
    "end_date": "2024-03-15T10:00:00Z",
    "expired_date": null
  },
  "payment": {
    "payment_id": "payment-uuid",
    "amount": 5000,
    "status": "success"
  }
}
```

### 8.7 Cancel Subscription
**Endpoint:** `PUT /subscriptions/cancel`

**Request Body:** None (empty body)

**Response:**
```json
{
  "subscription_id": "sub-uuid",
  "status": "canceled",
  "message": "Subscription canceled successfully"
}
```

**Note:** `isSubscribe` in profile automatically becomes `false` when canceled.

### 8.8 Family Plan Operations

#### Get Family Group
**Endpoint:** `GET /subscriptions/family/group`

**Response:**
```json
{
  "group_id": "group-uuid",
  "head_user_id": "user-uuid",
  "plan_id": "plan-uuid-2",
  "members": [
    {
      "member_id": "member-uuid",
      "user_id": "user-uuid",
      "is_head": true
    },
    {
      "member_id": "member-uuid-2",
      "user_id": "member-uuid-1",
      "is_head": false
    }
  ]
}
```

#### Add Family Member (Head Only)
**Endpoint:** `POST /subscriptions/family/members`

**Request Body:**
```json
{
  "user_id": "new-member-uuid"
}
```

**Response:**
```json
{
  "family_member_id": "member-uuid",
  "family_group_id": "group-uuid",
  "user_id": "new-member-uuid",
  "is_head": false,
  "subscription_required": true,
  "member_price": 1000,
  "billing_cycle": "monthly",
  "message": "Family member added. Member must activate their subscription by paying ₦1000.00 (monthly)"
}
```

**Important:** 
- Head pays: ₦2,000/month or ₦20,000/year
- Members pay: ₦1,000/month or ₦10,000/year (half price)
- Member must activate their subscription after being added

#### Remove Family Member
**Endpoint:** `DELETE /subscriptions/family/members`

**Request Body:**
```json
{
  "user_id": "member-to-remove-uuid"
}
```

**Response:**
```json
{
  "message": "Family member removed successfully"
}
```

---

## 9. Announcements

### 9.1 Get My Announcements
**Endpoint:** `GET /announcements/me?page=1&limit=20`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "data": [
    {
      "announcement_id": "announcement-uuid",
      "title": "Estate Meeting Scheduled",
      "message": "There will be an estate meeting on Saturday, January 20th at 2 PM in the community hall. All residents are encouraged to attend.",
      "announcement_type": "event",
      "recipient_type": "all_residents",
      "image_urls": [
        "https://storage.example.com/announcements/meeting-poster.jpg"
      ],
      "sender": {
        "first_name": "Admin",
        "last_name": "User"
      },
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 10,
  "totalPages": 1
}
```

**Note:** 
- Announcements are sent by Estate Admins only
- Automatically filtered by user's estate
- Can include images (`image_urls`)

### 9.2 Get Announcement by ID
**Endpoint:** `GET /announcements/{announcementId}`

**Response:**
```json
{
  "announcement_id": "announcement-uuid",
  "title": "Estate Meeting Scheduled",
  "message": "There will be an estate meeting...",
  "announcement_type": "event",
  "recipient_type": "all_residents",
  "image_urls": [
    "https://storage.example.com/announcements/meeting-poster.jpg"
  ],
  "sender": {
    "first_name": "Admin",
    "last_name": "User"
  },
  "created_at": "2024-01-15T10:00:00Z"
}
```

---

## 10. Flutter Integration Examples

### 10.1 API Service Setup

Create an API service file (`api_service.dart`):

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiService {
  final String baseUrl;
  final FlutterSecureStorage storage = const FlutterSecureStorage();

  ApiService({required this.baseUrl});

  // Get auth token
  Future<String?> getAuthToken() async {
    return await storage.read(key: 'access_token');
  }

  // Generic request method
  Future<Map<String, dynamic>> _request({
    required String method,
    required String endpoint,
    Map<String, dynamic>? body,
    Map<String, String>? headers,
  }) async {
    final token = await getAuthToken();
    final url = Uri.parse('$baseUrl$endpoint');

    final requestHeaders = {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
      ...?headers,
    };

    http.Response response;

    switch (method.toUpperCase()) {
      case 'GET':
        response = await http.get(url, headers: requestHeaders);
        break;
      case 'POST':
        response = await http.post(
          url,
          headers: requestHeaders,
          body: body != null ? jsonEncode(body) : null,
        );
        break;
      case 'PUT':
        response = await http.put(
          url,
          headers: requestHeaders,
          body: body != null ? jsonEncode(body) : null,
        );
        break;
      case 'DELETE':
        response = await http.delete(url, headers: requestHeaders);
        break;
      default:
        throw Exception('Unsupported HTTP method: $method');
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return jsonDecode(response.body);
    } else {
      final error = jsonDecode(response.body);
      throw Exception(error['message'] ?? 'Request failed');
    }
  }

  // GET request
  Future<Map<String, dynamic>> get(String endpoint) async {
    return await _request(method: 'GET', endpoint: endpoint);
  }

  // POST request
  Future<Map<String, dynamic>> post(
    String endpoint,
    Map<String, dynamic>? body,
  ) async {
    return await _request(method: 'POST', endpoint: endpoint, body: body);
  }

  // PUT request
  Future<Map<String, dynamic>> put(
    String endpoint,
    Map<String, dynamic>? body,
  ) async {
    return await _request(method: 'PUT', endpoint: endpoint, body: body);
  }

  // DELETE request
  Future<Map<String, dynamic>> delete(String endpoint) async {
    return await _request(method: 'DELETE', endpoint: endpoint);
  }
}
```

### 10.2 Authentication Service

```dart
class AuthService {
  final ApiService apiService;
  final FlutterSecureStorage storage = const FlutterSecureStorage();

  AuthService(this.apiService);

  Future<Map<String, dynamic>> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    required String estateId,
  }) async {
    return await apiService.post('/auth/register', {
      'email': email,
      'password': password,
      'first_name': firstName,
      'last_name': lastName,
      'estate_id': estateId,
    });
  }

  Future<Map<String, dynamic>> verifyOtp({
    required String userId,
    required String otp,
  }) async {
    return await apiService.post('/auth/verify-otp', {
      'user_id': userId,
      'otp': otp,
    });
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await apiService.post('/auth/login', {
      'email': email,
      'password': password,
    });

    // Store tokens
    await storage.write(
      key: 'access_token',
      value: response['access_token'],
    );
    await storage.write(
      key: 'refresh_token',
      value: response['refresh_token'],
    );

    return response;
  }

  Future<void> logout() async {
    await storage.delete(key: 'access_token');
    await storage.delete(key: 'refresh_token');
  }

  Future<Map<String, dynamic>> getCurrentUser() async {
    return await apiService.get('/users/me');
  }
}
```

### 10.3 Access Codes Service

```dart
class AccessCodesService {
  final ApiService apiService;

  AccessCodesService(this.apiService);

  Future<Map<String, dynamic>> createAccessCode({
    required String visitorName,
    String? visitorEmail,
    String? visitorPhone,
    required DateTime validFrom,
    required DateTime validTo,
    int maxUses = 1,
    String? gate,
    bool notifyOnUse = true,
  }) async {
    return await apiService.post('/access-codes', {
      'visitor_name': visitorName,
      'visitor_email': visitorEmail,
      'visitor_phone': visitorPhone,
      'valid_from': validFrom.toIso8601String(),
      'valid_to': validTo.toIso8601String(),
      'max_uses': maxUses,
      'gate': gate,
      'notify_on_use': notifyOnUse,
    });
  }

  Future<List<dynamic>> getMyAccessCodes() async {
    final response = await apiService.get('/access-codes');
    return response is List ? response : [];
  }

  Future<Map<String, dynamic>> deactivateAccessCode(String code) async {
    return await apiService.put('/access-codes/$code/deactivate', null);
  }

  // For Security Personnel
  Future<Map<String, dynamic>> validateAccessCode(String code) async {
    return await apiService.post('/access-codes/validate/$code', null);
  }
}
```

### 10.4 Alerts Service

```dart
class AlertsService {
  final ApiService apiService;

  AlertsService(this.apiService);

  Future<Map<String, dynamic>> createAlert({
    required String message,
    required String alertType,
    required String urgencyLevel,
    String recipientType = 'estate',
    List<String>? userIds,
  }) async {
    final Map<String, dynamic> recipients;
    
    if (recipientType == 'user' && userIds != null) {
      recipients = {
        'type': 'user',
        'user_ids': userIds,
      };
    } else {
      recipients = {'type': 'estate'};
    }

    return await apiService.post('/alerts', {
      'message': message,
      'alert_type': alertType,
      'urgency_level': urgencyLevel,
      'recipients': recipients,
    });
  }

  Future<Map<String, dynamic>> getMyAlerts({
    int page = 1,
    int limit = 20,
  }) async {
    return await apiService.get('/alerts/me?page=$page&limit=$limit');
  }

  Future<Map<String, dynamic>> getAlertById(String alertId) async {
    return await apiService.get('/alerts/$alertId');
  }

  Future<Map<String, dynamic>> updateAlert(
    String alertId,
    Map<String, dynamic> updates,
  ) async {
    return await apiService.put('/alerts/$alertId', updates);
  }

  Future<Map<String, dynamic>> deleteAlert(
    String alertId,
    {String? reason},
  ) async {
    return await apiService.delete('/alerts/$alertId');
  }
}
```

### 10.5 Wallet Service

```dart
class WalletService {
  final ApiService apiService;

  WalletService(this.apiService);

  Future<Map<String, dynamic>> getWallet() async {
    return await apiService.get('/wallets/me');
  }

  Future<Map<String, dynamic>> topUp({
    required double amount,
    String paymentMethod = 'paystack',
  }) async {
    return await apiService.post('/wallets/topup', {
      'amount': amount,
      'payment_method': paymentMethod,
    });
  }

  Future<Map<String, dynamic>> getTransactions({
    int page = 1,
    int limit = 20,
    String? purpose,
    String? direction,
    String? status,
  }) async {
    final queryParams = <String>[
      'page=$page',
      'limit=$limit',
      if (purpose != null) 'purpose=$purpose',
      if (direction != null) 'direction=$direction',
      if (status != null) 'status=$status',
    ];
    
    final queryString = queryParams.join('&');
    return await apiService.get('/wallets/me/transactions?$queryString');
  }

  Future<Map<String, dynamic>> transfer({
    required String recipientUserId,
    required double amount,
    required String purpose,
  }) async {
    return await apiService.post('/wallets/transfer', {
      'recipient_user_id': recipientUserId,
      'amount': amount,
      'purpose': purpose,
    });
  }
}
```

### 10.6 Subscription Service

```dart
class SubscriptionService {
  final ApiService apiService;

  SubscriptionService(this.apiService);

  Future<Map<String, dynamic>> getAvailablePlans() async {
    return await apiService.get('/subscriptions/plans');
  }

  Future<Map<String, dynamic>> activateSubscription({
    required String planId,
    required String paymentMethod,
  }) async {
    return await apiService.post('/subscriptions/activate', {
      'plan_id': planId,
      'payment_method': paymentMethod,
    });
  }

  Future<List<dynamic>> getMySubscriptions() async {
    final response = await apiService.get('/subscriptions/me');
    return response is List ? response : [];
  }

  Future<Map<String, dynamic>> getActiveSubscription() async {
    return await apiService.get('/subscriptions/me/active');
  }

  Future<Map<String, dynamic>> renewSubscription(String paymentMethod) async {
    return await apiService.put('/subscriptions/renew', {
      'payment_method': paymentMethod,
    });
  }

  Future<Map<String, dynamic>> cancelSubscription() async {
    return await apiService.put('/subscriptions/cancel', null);
  }

  Future<Map<String, dynamic>> getFamilyGroup() async {
    return await apiService.get('/subscriptions/family/group');
  }

  Future<Map<String, dynamic>> addFamilyMember(String userId) async {
    return await apiService.post('/subscriptions/family/members', {
      'user_id': userId,
    });
  }

  Future<Map<String, dynamic>> removeFamilyMember(String userId) async {
    return await apiService.delete('/subscriptions/family/members');
  }
}
```

### 10.7 Example Flutter Widget - Access Code Creation

```dart
import 'package:flutter/material.dart';

class CreateAccessCodeScreen extends StatefulWidget {
  @override
  _CreateAccessCodeScreenState createState() => _CreateAccessCodeScreenState();
}

class _CreateAccessCodeScreenState extends State<CreateAccessCodeScreen> {
  final _formKey = GlobalKey<FormState>();
  final _visitorNameController = TextEditingController();
  final _visitorEmailController = TextEditingController();
  final _visitorPhoneController = TextEditingController();
  final _accessCodesService = AccessCodesService(apiService);
  
  DateTime? _validFrom;
  DateTime? _validTo;
  bool _isLoading = false;

  Future<void> _createAccessCode() async {
    if (!_formKey.currentState!.validate()) return;
    if (_validFrom == null || _validTo == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Please select valid dates')),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final result = await _accessCodesService.createAccessCode(
        visitorName: _visitorNameController.text,
        visitorEmail: _visitorEmailController.text.isEmpty 
            ? null 
            : _visitorEmailController.text,
        visitorPhone: _visitorPhoneController.text.isEmpty 
            ? null 
            : _visitorPhoneController.text,
        validFrom: _validFrom!,
        validTo: _validTo!,
      );

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Access code created: ${result['code']}'),
        ),
      );
      Navigator.pop(context);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Create Access Code')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _visitorNameController,
              decoration: InputDecoration(labelText: 'Visitor Name'),
              validator: (value) => 
                  value?.isEmpty ?? true ? 'Required' : null,
            ),
            SizedBox(height: 16),
            TextFormField(
              controller: _visitorEmailController,
              decoration: InputDecoration(labelText: 'Visitor Email (Optional)'),
              keyboardType: TextInputType.emailAddress,
            ),
            SizedBox(height: 16),
            TextFormField(
              controller: _visitorPhoneController,
              decoration: InputDecoration(labelText: 'Visitor Phone (Optional)'),
              keyboardType: TextInputType.phone,
            ),
            SizedBox(height: 16),
            ListTile(
              title: Text('Valid From'),
              subtitle: Text(_validFrom?.toString() ?? 'Select date'),
              onTap: () async {
                final date = await showDatePicker(
                  context: context,
                  initialDate: DateTime.now(),
                  firstDate: DateTime.now(),
                  lastDate: DateTime.now().add(Duration(days: 365)),
                );
                if (date != null) {
                  setState(() => _validFrom = date);
                }
              },
            ),
            ListTile(
              title: Text('Valid To'),
              subtitle: Text(_validTo?.toString() ?? 'Select date'),
              onTap: () async {
                final date = await showDatePicker(
                  context: context,
                  initialDate: _validFrom ?? DateTime.now(),
                  firstDate: _validFrom ?? DateTime.now(),
                  lastDate: DateTime.now().add(Duration(days: 365)),
                );
                if (date != null) {
                  setState(() => _validTo = date);
                }
              },
            ),
            SizedBox(height: 24),
            ElevatedButton(
              onPressed: _isLoading ? null : _createAccessCode,
              child: _isLoading 
                  ? CircularProgressIndicator() 
                  : Text('Create Access Code'),
            ),
          ],
        ),
      ),
    );
  }
}
```

### 10.8 Example Flutter Widget - Security Access Code Validation

```dart
class ValidateAccessCodeScreen extends StatefulWidget {
  @override
  _ValidateAccessCodeScreenState createState() => 
      _ValidateAccessCodeScreenState();
}

class _ValidateAccessCodeScreenState extends State<ValidateAccessCodeScreen> {
  final _codeController = TextEditingController();
  final _accessCodesService = AccessCodesService(apiService);
  bool _isLoading = false;
  Map<String, dynamic>? _validationResult;

  Future<void> _validateCode() async {
    if (_codeController.text.isEmpty) return;

    setState(() {
      _isLoading = true;
      _validationResult = null;
    });

    try {
      final result = await _accessCodesService.validateAccessCode(
        _codeController.text.toUpperCase(),
      );
      setState(() => _validationResult = result);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Validate Access Code')),
      body: ListView(
        padding: EdgeInsets.all(16),
        children: [
          TextField(
            controller: _codeController,
            decoration: InputDecoration(
              labelText: 'Access Code',
              hintText: 'Enter code',
            ),
            textCapitalization: TextCapitalization.characters,
          ),
          SizedBox(height: 16),
          ElevatedButton(
            onPressed: _isLoading ? null : _validateCode,
            child: _isLoading 
                ? CircularProgressIndicator() 
                : Text('Validate'),
          ),
          if (_validationResult != null) ...[
            SizedBox(height: 24),
            Card(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Valid Access Code',
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                    SizedBox(height: 8),
                    Text('Visitor: ${_validationResult!['visitor_name']}'),
                    Text('Creator: ${_validationResult!['creator_name']}'),
                    Text('House: ${_validationResult!['creator_house_address'] ?? 'Not set'}'),
                    Text('Remaining Uses: ${_validationResult!['remaining_uses']}'),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
```

---

## Error Handling

### Common Error Responses

**401 Unauthorized:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```
**Solution:** Token expired or invalid. Redirect to login.

**403 Forbidden:**
```json
{
  "statusCode": 403,
  "message": "Forbidden resource"
}
```
**Solution:** User doesn't have required permissions.

**404 Not Found:**
```json
{
  "statusCode": 404,
  "message": "Resource not found"
}
```
**Solution:** Resource doesn't exist.

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": "Validation error",
  "errors": ["Field is required"]
}
```
**Solution:** Show validation errors to user.

---

## Important Notes

1. **Authentication:** Always include `Authorization: Bearer {token}` header
2. **Estate Scoping:** All operations are automatically scoped to user's estate
3. **Access Codes:** Security can only verify codes from their estate
4. **Service Charges:** Users can only upload receipts; admins update amounts
5. **Subscriptions:** Family members pay half price (automatically detected)
6. **Image Uploads:** Upload images to storage first, then provide URLs in API requests
7. **Pagination:** Most list endpoints support `page` and `limit` query parameters
8. **Token Storage:** Use `flutter_secure_storage` for secure token storage
9. **Error Handling:** Always handle API errors gracefully in Flutter widgets

---

## Role-Based Access Summary

### Security Personnel
- ✅ Verify access codes (estate-scoped)
- ✅ View estate alerts
- ✅ View estate announcements
- ✅ View estate users (read-only)
- ❌ Cannot create alerts
- ❌ Cannot manage users

### Residents
- ✅ Create access codes
- ✅ Send alerts to estate
- ✅ Report lost & found items
- ✅ Create service charge records and upload receipts
- ✅ View service providers and leave reviews
- ✅ Top up wallet and view transactions
- ✅ Manage subscriptions
- ✅ View announcements
- ✅ Update own profile
- ❌ Cannot manage other users
- ❌ Cannot validate service charges

---

**Last Updated:** January 2024  
**Version:** 1.0

