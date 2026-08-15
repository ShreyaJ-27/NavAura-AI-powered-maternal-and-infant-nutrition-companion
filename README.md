# NavAura 🌸 — AI-Powered Maternal & Infant Nutrition Companion

> **"One Plate. Two Journeys."**  
> An intelligent, calming nutrition and wellness companion designed for postpartum mothers and infants (0–24 months), bridging recovery nourishment with deterministic pediatric feeding safety and voice-enabled wellness.

---

## 🌟 Key Innovations

- **Talk to NavAura (Voice AI)**:
  - Dedicated, hands-free voice experience powered by **Vapi** (Emma voice) and **Groq** reasoning.
  - User-initiated (zero auto-listen, no mic activation until clicking *Start Conversation*).
  - Multi-child intelligence distinguishing each child (e.g. Ava 8m vs. Mira 2m) with clear disambiguation before logging records.
  - Real-time tool capabilities: log feeds, retrieve feeding summaries, monitor hydration, inspect scanned meals, and voice navigation.
- **One Plate, Two Journeys**: Every meal photographed yields dual distinct health perspectives:
  - **🤍 FOR YOU (Mother)**: Tracks tissue repair nutrients (iron, protein, calcium, vitamins), lactation hydration context, and gentle wellness check-ins.
  - **🌷 FOR BABY (Infant)**: Evaluates age-appropriate textures, choking hazard mitigation, and WHO/UNICEF complementary feeding protocols.
- **Multimodal AI Perception + Deterministic Medical Rules**:
  - **Groq Vision Perception** (`qwen/qwen3.6-27b`) for real-time food identification.
  - **USDA FoodData Central** verified nutrition database mapping.
  - **Deterministic Pediatric Rules Engine** ensuring zero hallucinations for infant safety.
- **Calm, Editorial Glassmorphic Design**:
  - Designed around an organic, soft pastel atmosphere (`#F7F4F2` base, blush, lavender, rose-gold, and muted sage).
  - Floating translucent cards, interactive 3D Journey Orb, acoustic Voice Orb, and conversational health companion widget.
- **100% End-to-End Functional**:
  - **Talk to NavAura Voice AI**: Conversational logging, memory, and navigation.
  - **AI Meal Scanner**: Dual-panel evaluation with explainable AI timeline.
  - **Infant Feeding Tracker**: Log breastfeeding, expressed milk, formula, and complementary solids.
  - **Maternal Hydration Log**: Real-time fluid balance tracker towards 2.5 L lactation target.
  - **Maternal Wellness Check-In**: Physical vitality, sleep stamina, and emotional equilibrium logs.
  - **Baby Solid Food Catalog**: 3-day single-ingredient introduction tracking with tolerance notes.
  - **Verified Food Library**: Searchable database of evidence-backed foods.
  - **One-Click Demo Mode**: Instant preview with multi-child synthetic profiles (Elena Vance, Ava, Mira).

---

## 🎙️ Voice AI Architecture

```
User Voice Speech
       │
       ▼
 Vapi Web SDK (@vapi-ai/web) <───> Interactive Voice Orb UI (/voice)
       │ (Transcriptions & Tool Calls)
       ▼
NavAura Server Route (/api/voice/chat, /api/voice/tools, /api/voice/context)
       │
       ├──> Groq AI (Llama 3.3 70B / Qwen 3.6 27B) [Maternal Clinical Reasoning]
       ├──> Pediatric Safety Engine (WHO / UNICEF / AAP Guidelines)
       └──> Supabase Database (Babies, Feedings, Hydration, Meals, Wellness)
       │
       ▼
 Vapi Emma Voice Synthesis + Real-Time Reactive UI Updates
```

---

## 🛠️ Technology Stack

- **Framework**: Next.js 16 (App Router & Turbopack)
- **Language**: TypeScript
- **Voice AI**: Vapi Web SDK (`@vapi-ai/web`) with Emma voice
- **Reasoning & Vision**: Groq AI (`llama-3.3-70b-versatile`, `qwen/qwen3.6-27b`)
- **Styling**: Tailwind CSS v4 & Vanilla CSS Glassmorphism
- **Database & Auth**: Supabase PostgreSQL with SSR Cookie Auth & Row Level Security (RLS)
- **3D Visualization**: Three.js / React Three Fiber

---

## 🚀 Quick Start (Local Development)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/ViivianREINE/NavAura-AI-powered-maternal-and-infant-nutrition-companion.git
cd NavAura-AI-powered-maternal-and-infant-nutrition-companion
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Groq Vision & Reasoning AI
GROQ_API_KEY=your-groq-api-key
GROQ_VISION_MODEL=qwen/qwen3.6-27b

# Vapi Voice AI Agent
NEXT_PUBLIC_VAPI_PUBLIC_KEY=your-vapi-public-key
VAPI_PRIVATE_KEY=your-vapi-private-key
VAPI_ASSISTANT_ID=your-vapi-assistant-id
NEXT_PUBLIC_VAPI_ASSISTANT_ID=your-vapi-assistant-id
```

### 3. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## ☁️ Deployment Instructions (Vercel)

1. Go to **[Vercel Dashboard](https://vercel.com/new)** and import your repository.
2. **Framework Preset**: `Next.js` (Root Directory: `./` by default).
3. **Add Environment Variables in Vercel Project Settings**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GROQ_API_KEY`
   - `GROQ_VISION_MODEL`
   - `NEXT_PUBLIC_VAPI_PUBLIC_KEY`
   - `VAPI_PRIVATE_KEY`
   - `VAPI_ASSISTANT_ID`
   - `NEXT_PUBLIC_VAPI_ASSISTANT_ID`
4. Click **Deploy**. Vercel will build and deploy the Next.js application.

---

## 🔒 Security & Privacy

- **Zero Global Mic Listen**: Microphone is strictly requested on-demand when the mother presses *Start Conversation*.
- **Row Level Security (RLS)**: Enforces that mothers only access and modify their own children's feeding and health logs.
- **Strict Server-Side Key Management**: Private Vapi, Groq, and Supabase service-role keys are never transmitted to browser bundles.

---

## 📄 License
Apache License Version 2.0. Created with ❤️ for the CS Girlies Annual Hackathon — Technology For Wellness.