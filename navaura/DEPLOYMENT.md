# NavAura Deployment Guide

Complete end-to-end setup for production deployment with Supabase authentication, database, and storage.

## Prerequisites

- Node.js 18+ and npm
- A Supabase account ([https://supabase.com](https://supabase.com))
- A Groq API key ([https://console.groq.com](https://console.groq.com))
- Git

## 1. Local Development Setup

### 1.1 Install Dependencies

```bash
cd navaura
npm install
```

### 1.2 Configure Environment Variables

Create `.env.local` with these values:

```env
# Supabase Configuration (from your project settings)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key

# Groq API Configuration
GROQ_API_KEY=your-groq-api-key
GROQ_VISION_MODEL=qwen/qwen3.6-27b

# Supabase Service Role (for server-side operations)
# Find this in Supabase Settings > API > Service Role Key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Where to find these values in Supabase:**
- URL and Keys: Project Settings > API
- Service Role Key: Project Settings > API (under "Service Role")

### 1.3 Verify Build

```bash
npm run build
npm test
```

Expected output: "4 pass" (all tests pass)

---

## 2. Supabase Database Setup

### 2.1 Create a New Supabase Project

1. Log in to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in:
   - Name: `navaura`
   - Database Password: Generate strong password
   - Region: Choose closest to your users
4. Click "Create new project" (takes ~2 minutes)

### 2.2 Run Database Migrations

Once your project is ready:

1. Go to Supabase Dashboard > SQL Editor
2. Click "New Query"
3. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
4. Paste into the query editor
5. Click "Run"

**What this creates:**
- `profiles` table: Mother onboarding data
- `babies` table: Baby information and birth dates
- `meals` table: Meal records with Groq analysis results
- `meal_images` table: Image metadata linked to meals
- RLS (Row-Level Security) policies for data isolation
- Indexes for performance

### 2.3 Verify Schema

In SQL Editor, run:

```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

You should see: `profiles`, `babies`, `meals`, `meal_images`

---

## 3. Supabase Storage Setup

### 3.1 Create Storage Bucket

1. Go to Supabase Dashboard > Storage
2. Click "Create new bucket"
3. Bucket name: `meal-images`
4. **Important**: Set to **PRIVATE** (not public)
5. Click "Create bucket"

### 3.2 Set Storage Policies

Storage uses RLS (Row-Level Security) policies. In Supabase:

1. Go to Storage > meal-images > Policies
2. Click "New Policy"
3. Select "For full customization, use custom policies" (SQL editor)

#### Policy 1: Allow authenticated users to upload images

```sql
CREATE POLICY "Users can upload meal images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'meal-images' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

Click "Review" > "Save policy"

#### Policy 2: Allow users to access their own images

```sql
CREATE POLICY "Users can read their own images"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'meal-images' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

Click "Review" > "Save policy"

#### Policy 3: Allow users to delete their own images

```sql
CREATE POLICY "Users can delete their own images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'meal-images' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

Click "Review" > "Save policy"

### 3.3 Verify Policies

You should see 3 policies in the Policies tab. The application automatically uploads images to:
```
meal-images/{user_id}/{filename}
```

The `{user_id}` folder ensures RLS automatic enforcement.

---

## 4. Authentication Setup

### 4.1 Configure Email Authentication

1. Go to Supabase Dashboard > Authentication > Providers
2. Email provider should be enabled by default
3. Go to Settings (auth settings):
   - Enable "Email Confirmations" if desired (adds verification step)
   - Configure "Site URL" (for production: your domain)
   - Configure "Redirect URLs" (auth callbacks)

### 4.2 Configure Redirect URLs (Production)

In Authentication > URL Configuration:

**Site URL**: `https://yourdomain.com`

**Redirect URLs** (add these):
```
https://yourdomain.com/auth/callback
https://yourdomain.com/dashboard
http://localhost:3000 (for development)
```

---

## 5. Application Walkthrough

### 5.1 User Registration & Onboarding

1. Visit `/auth/sign-up`
2. Create account with email and password
3. Redirects to `/onboarding` (4-step form)
4. Step 1: Mother information (name, delivery date, feeding method)
5. Step 2: Nutrition preferences & allergen awareness
6. Step 3: Baby information (name, birth date, weight)
7. Step 4: Review and save
8. Data saves to `profiles` and `babies` tables
9. Redirects to `/dashboard` (requires auth)

### 5.2 Dashboard

- Shows mother postpartum stage
- Shows baby age calculation
- Future: Will show meal history and recommendations

### 5.3 Meal Scanning & Analysis

1. Visit `/scanner` (requires auth)
2. Select baby (from dropdown)
3. Upload meal image
4. Groq Vision analyzes food:
   - Identifies foods in image
   - Confidence scores
   - Visible portions
   - Meal description
5. Safety evaluation:
   - Checks if foods are age-appropriate
   - Flags potential choking risks
   - Stores analysis in database
6. Image uploads to Storage
7. Meal record created with full analysis

---

## 6. API Routes

All API routes require authentication (checked server-side).

### POST `/api/meals`

Upload a meal photo for analysis.

**Request:**
```javascript
const formData = new FormData();
formData.append('image', imageFile);
formData.append('babyId', babyId); // optional

const response = await fetch('/api/meals', {
  method: 'POST',
  body: formData,
});
```

**Response:**
```json
{
  "success": true,
  "meal": {
    "id": "uuid",
    "food_name": "string",
    "analysis": {
      "foods": [
        {
          "name": "food name",
          "confidence": 0.95,
          "visible_portion": "medium"
        }
      ],
      "meal_description": "...",
      "uncertainty": "..."
    },
    "safetyNotes": {
      "safeForAge": true,
      "warnings": [],
      "recommendations": []
    }
  }
}
```

### GET `/api/meals/list?limit=10&offset=0`

Retrieve user's meals.

**Query parameters:**
- `limit`: Number of meals (default: 10)
- `offset`: Pagination offset (default: 0)
- `babyId`: Filter by baby (optional)

**Response:**
```json
{
  "meals": [
    {
      "id": "uuid",
      "food_name": "string",
      "created_at": "2024-01-01T00:00:00Z",
      "analysis": {...},
      "safety_notes": {...},
      "meal_images": [
        {
          "storage_path": "...",
          "file_name": "...",
          "file_size_bytes": 12345
        }
      ]
    }
  ],
  "total": 42
}
```

### DELETE `/api/meals/list`

Delete a meal (also deletes associated images).

**Request:**
```javascript
await fetch('/api/meals/list', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ mealId: 'uuid' }),
});
```

---

## 7. Production Deployment

### 7.1 Environment Setup

1. Deploy to Vercel / your hosting platform
2. Set all `.env.local` variables in deployment platform's environment settings
3. Ensure all `NEXT_PUBLIC_*` variables are also set
4. Redeploy

### 7.2 Configure CORS (if needed)

In Supabase Settings > API > CORS:
```
https://yourdomain.com
https://www.yourdomain.com
```

### 7.3 Post-Deployment Testing

1. Visit your deployed site
2. Complete full flow: Sign-up → Onboarding → Upload meal
3. Verify data appears in Supabase Dashboard

---

## 8. Troubleshooting

### "Unauthorized" error on meal upload
- Check: User is logged in (auth session exists)
- Check: Baby ID is valid and belongs to user

### "Could not identify food items"
- Check: Image is clear and well-lit
- Check: Food items are visible in image
- Try: Different lighting or angle

### Storage upload fails
- Check: `meal-images` bucket exists and is PRIVATE
- Check: All 3 storage policies are created
- Check: User ID in path matches authenticated user

### Database insert fails
- Check: Database tables exist (run migration)
- Check: RLS policies allow INSERT (should be enabled by default)
- Check: User ID matches authenticated user

### Groq API errors
- Check: `GROQ_API_KEY` is correct
- Check: API key has vision model access
- Check: Image file is valid (JPEG/PNG under 20MB)

---

## 9. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        NavAura App (Next.js)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  /auth/sign-in, /auth/sign-up  ──► Supabase Auth               │
│                                                                 │
│  /onboarding                   ──► Database: profiles, babies   │
│                                                                 │
│  /dashboard                    ──► Database: profiles, babies   │
│                                                                 │
│  /scanner ──► /api/meals       ──► Groq Vision API             │
│       │            │                                            │
│       └────────────┼──────────────► Supabase Storage (images)   │
│                    │                                            │
│                    └──────────────► Database: meals, meal_images│
│                                                                 │
│  /api/meals/list               ──► Database: meals, meal_images│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. Database Schema Quick Reference

### profiles table
- `id` (UUID): User ID from Supabase Auth
- `mother_name` (text): Name entered in onboarding
- `postpartum_date` (date): Date of delivery
- `feeding_method` (text): Breastfeeding, formula, or combo
- `dietary_restrictions` (text): Any restrictions
- `allergen_awareness` (boolean): If user is allergen-aware

### babies table
- `id` (UUID): Unique baby ID
- `user_id` (UUID): Link to profiles table
- `name` (text): Baby's name
- `birth_date` (date): Date of birth
- `birth_weight_kg` (numeric): Weight at birth

### meals table
- `id` (UUID): Unique meal ID
- `user_id` (UUID): User who created record
- `baby_id` (UUID): Optional link to babies table
- `food_name` (text): Primary food identified
- `analysis` (JSONB): Full Groq response
- `texture` (text): Food texture description
- `preparation` (text): How food was prepared
- `allergen_status` (text): Allergen information
- `safety_notes` (JSONB): Safety evaluation results
- `created_at` (timestamp): When meal was recorded

### meal_images table
- `id` (UUID): Unique image ID
- `meal_id` (UUID): Link to meals table
- `storage_path` (text): Path in Supabase Storage
- `file_name` (text): Original filename
- `file_size_bytes` (integer): File size
- `mime_type` (text): Image MIME type

---

## Support

For issues or questions:
1. Check Supabase documentation: https://supabase.com/docs
2. Check Next.js documentation: https://nextjs.org
3. Review error messages in browser console and server logs
4. Check Supabase Dashboard > Logs for API/database errors

---

**Last Updated**: 2024
**NavAura Version**: 0.1.0
