# PayShield AI — Hackathon Video Recording Checklist

**Target Video Length:** 2:40 – 2:50  
**Resolution:** 1080p (1920×1080) at 60 FPS  
**Format:** MP4 (H.264 / AAC)  
**Audio:** Clear microphone with noise cancellation; no distracting background audio  

---

## 1. Pre-Recording Preparation

- [ ] **Clean Browser Profile:** Open Chrome or Edge in a dedicated window without browser extensions or bookmarks bar visible.
- [ ] **Zoom / Viewport:** Set browser zoom to 100% at 1920×1080 resolution.
- [ ] **Application State:** Verify the server is running locally (`http://localhost:5173`) or open the live deployment (`https://payshield-ai-liard.vercel.app`).
- [ ] **Merchant Account Logged In:** Sign in with `merchant@example.com` before pressing record so the dashboard loads immediately.
- [ ] **Audio Check:** Test microphone input levels; maintain consistent speaking volume.
- [ ] **Timer:** Have a silent stopwatch visible off-camera to keep segments within the 2m 45s mark.

---

## 2. In-Recording Cue Sheet

| Segment | Timing | Action on Screen | Audio Keyphrase |
|:---|:---:|:---|:---|
| **1. The Problem** | 0:00–0:20 | Presenter on camera or split view with chargeback graphic | *"Traditional fraud filters are an opaque black box..."* |
| **2. The Solution** | 0:20–0:45 | Show clean PayShield AI dashboard at `localhost:5173` or live URL | *"Meet PayShield AI—an explainable risk intelligence platform..."* |
| **3. PayPal Sandbox** | 0:45–1:20 | Go to `/paypal-sandbox`, click `$125` preset, then Execute. Next click `$2,850` preset and Execute. | *"Our backend strictly validates amount and currency server-side..."* |
| **4. AI Dossier** | 1:20–1:55 | Click **Inspect in Dossier**. Point to score gauge, rules, ML fraud %, and Gemini explanation. | *"Inside the investigation dossier, merchants see exactly why an order was flagged..."* |
| **5. Dashboard & Reports**| 1:55–2:20 | Go to Overview (`/`), scroll down detection chart. Go to Insights (`/insights`), click **Download CSV**. | *"On the Overview Dashboard, merchants track real-time telemetry..."* |
| **6. Security & Audit** | 2:20–2:40 | Switch to **Cryptographic Audit Proof** tab. Click **Verify**, then click **Simulate DB Tamper**. | *"We enforce strict multi-tenant merchant isolation and an RFC 6962 hash chain..."* |
| **7. Closing** | 2:40–2:45 | Return to home dashboard with GitHub URL on screen | *"PayShield AI: transparent, explainable, and secure payment protection."* |

---

## 3. Post-Recording Quality Assurance

- [ ] **Duration Check:** Total video runtime must be ≤ 2 minutes 50 seconds.
- [ ] **Audio Clarity:** Speech is clear and audible over any subtle background track.
- [ ] **No Secret Exposure:** Ensure no API secrets, database passwords, or private environment variables appear in terminal or code windows.
- [ ] **Export Settings:** Render at 1080p 60fps with high bitrate (~15–20 Mbps).
- [ ] **Upload:** Upload to YouTube as **Unlisted** (or Public) or Vimeo with sharing enabled. Add link to Devpost submission draft.
