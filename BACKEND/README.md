# 🚗 Smart Parking Violation System — Backend

Node.js + Express + MongoDB backend. Hosted FREE on Render.com.

---

## 📁 Project Structure

```
parking-backend/
├── server.js              ← Entry point (start here)
├── .env.example           ← Copy to .env and fill values
├── config/
│   └── db.js              ← MongoDB connection
├── models/
│   ├── Violation.js       ← Single violation record schema
│   └── Vehicle.js         ← Per-vehicle summary schema
├── routes/
│   ├── plate.js           ← Number plate detection (Plate Recognizer API)
│   ├── violations.js      ← Core logic: check / record / pay / history
│   ├── vehicles.js        ← Vehicle profile + blacklist
│   └── stats.js           ← Dashboard stats + monthly chart
└── middleware/
    └── adminAuth.js       ← Token-based admin protection
```

---

## ⚙️ Setup (Local)

### Step 1: Install Node.js
Download from https://nodejs.org (LTS version)

### Step 2: Install dependencies
```bash
cd parking-backend
npm install
```

### Step 3: Create .env file
```bash
cp .env.example .env
```
Then open `.env` and fill in:
- `MONGODB_URI` — from MongoDB Atlas (see below)
- `PLATE_RECOGNIZER_API_KEY` — from platerecognizer.com (free)
- `ADMIN_SECRET` — any random long string you make up

### Step 4: Get MongoDB Atlas free database
1. Go to https://cloud.mongodb.com
2. Sign up → Create free cluster
3. Click **Connect** → **Drivers**
4. Copy the connection string and paste into MONGODB_URI in .env

### Step 5: Get Plate Recognizer API key
1. Go to https://platerecognizer.com
2. Sign up free (2500 scans/month)
3. Copy API key → paste into PLATE_RECOGNIZER_API_KEY in .env

### Step 6: Run locally
```bash
npm run dev
```
Server starts at http://localhost:5000

---

## 🚀 Deploy to Render (Free)

1. Push code to GitHub (without .env file)
2. Go to https://render.com → New → Web Service
3. Connect your GitHub repo
4. Settings:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node
5. Add Environment Variables (copy from .env):
   - MONGODB_URI
   - PLATE_RECOGNIZER_API_KEY
   - FINE_AMOUNT
   - COMPANY_NAME
   - ADMIN_SECRET
6. Click **Deploy**

Your API will be live at: `https://yourapp.onrender.com`

---

## 📡 API Reference

### Base URL
- Local: `http://localhost:5000`
- Production: `https://yourapp.onrender.com`

---

### 1. Detect Number Plate
**POST** `/api/plate/detect`

Upload vehicle photo → get plate number automatically.

```
Content-Type: multipart/form-data
Body: photo (image file)
```

Response:
```json
{
  "success": true,
  "plateNumber": "MH12AB1234",
  "confidence": 94
}
```

---

### 2. Check Vehicle (before recording)
**POST** `/api/violations/check`

Check if vehicle is first-time or repeat offender.

```json
Body: { "vehicleNumber": "MH12AB1234" }
```

Response:
```json
{
  "success": true,
  "vehicleNumber": "MH12AB1234",
  "isFirstTime": false,
  "totalPastViolations": 2,
  "action": "FINE",
  "fineAmount": 500,
  "message": "Repeat offender (2 past violations). Fine of ₹500 will be issued."
}
```

---

### 3. Record Violation
**POST** `/api/violations/record`

Record warning or fine after guard fills details.

```json
Body: {
  "vehicleNumber": "MH12AB1234",
  "ownerName": "Rajesh Kumar",
  "mobileNumber": "9876543210",
  "officeNumber": "B-204",
  "violationType": "NO_PARKING",
  "recordedBy": "Guard Suresh",
  "notes": "Parked in fire exit lane"
}
```

violationType options: `NO_PARKING`, `WRONG_PARKING`, `BLOCKING_GATE`, `OTHER`

Response includes `violation` object and `receipt` object (use receipt to show/print).

---

### 4. Mark Fine as Paid
**PATCH** `/api/violations/:id/pay`

```
No body needed. Just send the violation ID in URL.
```

---

### 5. Violation History
**GET** `/api/violations/history`

Filter and paginate all records.

```
Query params:
?vehicleNumber=MH12AB1234
?action=FINE
?finePaid=false
?page=1&limit=20
?startDate=2024-01-01&endDate=2024-12-31
```

---

### 6. Vehicle Profile
**GET** `/api/vehicles/:vehicleNumber`

Full history of one vehicle.

---

### 7. Dashboard Stats
**GET** `/api/stats/dashboard`

All numbers for admin dashboard:
- Total violations, warnings, fines
- Today's count
- Money collected vs due

---

### 8. Monthly Stats
**GET** `/api/stats/monthly`

Last 6 months data for charts.

---

### 9. Blacklist Vehicle (admin only)
**PATCH** `/api/vehicles/:vehicleNumber/blacklist`

```
Headers: Authorization: Bearer <ADMIN_SECRET>
Body: { "blacklisted": true }
```

---

## 🔒 Admin Routes
Some routes require the admin token. Send in header:
```
Authorization: Bearer your_admin_secret_here
```

---

## 💡 Fine Logic

| Violation Count | Action  | Amount |
|----------------|---------|--------|
| 1st time       | WARNING | ₹0     |
| 2nd time       | FINE    | ₹500   |
| 3rd time+      | FINE    | ₹500   |

Change amount in `.env` → `FINE_AMOUNT=500`
