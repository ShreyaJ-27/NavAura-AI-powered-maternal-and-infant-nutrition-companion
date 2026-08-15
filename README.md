# NavAura 🌸 — AI-Powered Maternal & Infant Nutrition Companion

> **"One Plate. Two Journeys."**  
> An intelligent, calming nutrition and wellness companion designed for postpartum mothers and infants (0–24 months), bridging recovery nourishment with deterministic pediatric feeding safety.

---

## 🌟 Key Innovations

- **One Plate, Two Journeys**: Every meal photographed yields dual distinct health perspectives:
  - **🤍 FOR YOU (Mother)**: Tracks tissue repair nutrients (iron, protein, calcium, vitamins), lactation hydration context, and gentle wellness check-ins.
  - **🌷 FOR BABY (Infant)**: Evaluates age-appropriate textures, choking hazard mitigation, and WHO/UNICEF complementary feeding protocols.
- **Multimodal AI Perception + Deterministic Medical Rules**:
  - **Groq Vision Perception** (`qwen/qwen3.6-27b`) for real-time food identification.
  - **USDA FoodData Central** verified nutrition database mapping.
  - **Deterministic Pediatric Rules Engine** ensuring zero hallucinations for infant safety.
- **Calm, Editorial Glassmorphic Design**:
  - Designed around an organic, soft pastel atmosphere (`#F7F4F2` base, blush, lavender, rose-gold, and muted sage).
  - Floating translucent cards, interactive 3D Journey Orb, and conversational health companion widget.
- **100% End-to-End Functional**:
  - **AI Meal Scanner**: Dual-panel evaluation with explainable AI timeline.
  - **Infant Feeding Tracker**: Log breastfeeding, expressed milk, formula, and complementary solids.
  - **Maternal Hydration Log**: Real-time fluid balance tracker towards 2.5 L lactation target.
  - **Maternal Wellness Check-In**: Physical vitality, sleep stamina, and emotional equilibrium logs.
  - **Baby Solid Food Catalog**: 3-day single-ingredient introduction tracking with tolerance notes.
  - **Verified Food Library**: Searchable database of evidence-backed foods.
  - **One-Click Demo Mode**: Instant preview without requiring email confirmation.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 16 (App Router & Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 & Vanilla CSS Glassmorphism
- **Database & Auth**: Supabase PostgreSQL with SSR Cookie Auth & Row Level Security (RLS)
- **AI Perception**: Groq Vision API (`qwen/qwen3.6-27b`, `llama-3.2-11b-vision-preview`)
- **3D Visualization**: Three.js / React Three Fiber

---

## 🚀 Quick Start (Local Development)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/ViivianREINE/NavAura-AI-powered-maternal-and-infant-nutrition-companion.git
cd NavAura-AI-powered-maternal-and-infant-nutrition-companion/navaura
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the `navaura/` directory:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
GROQ_API_KEY=your-groq-api-key
GROQ_MODEL=qwen/qwen3.6-27b
```

### 3. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## ☁️ Deployment Instructions (Vercel)

1. **Push to GitHub** (already configured on the `main` branch).
2. Go to **[Vercel Dashboard](https://vercel.com/new)** and import your repository:
   - **Root Directory**: Select `navaura`.
   - **Framework Preset**: `Next.js`.
3. **Add Environment Variables in Vercel Project Settings**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GROQ_API_KEY`
   - `GROQ_MODEL`
4. Click **Deploy**. Vercel will build and launch the production URL.

---

## 🔒 Security & Privacy

- **Row Level Security (RLS)** ensures each mother's data is isolated and strictly protected.
- **Server-Side API Handlers** guarantee that Groq and Supabase service keys are never exposed to browser clients.

---

## 📄 License
MIT License. Created with ❤️ for the CS Girlies Annual Hackathon — Technology For Wellness.