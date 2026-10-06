# TeleHealth Hub: HIPAA-Conscious MERN Microservices Platform

An enterprise-grade, HIPAA-conscious telemedicine portal built on a modular MERN microservices architecture. It enables peer-to-peer encrypted WebRTC video consultations with time-limited TURN credentials, client-side ECDH (P-256) key agreement with safety fingerprint verification, real-time biometric vital telemetry streams with threshold escalation, and AES-256-GCM encrypted Electronic Health Records (EHR) backed by a tamper-evident SHA-256 hash-chained audit trail.

---

## 1. Microservices Architecture

```
healthcare-portal/
├── services/
│   ├── gateway/           # API Gateway & Reverse Proxy (Port 5000)
│   ├── auth-service/      # Identity, RBAC, Consents, TOTP MFA, Lockout (Port 5001)
│   ├── signaling-service/ # WebRTC Signaling, Waiting Room, TURN Tokens (Port 5002)
│   ├── ehr-service/       # AES-256-GCM EHR, ICD-10, Hash-Chained Audit Trail (Port 5003)
│   └── vitals-service/    # Real-Time Socket Telemetry & IoT Wearable Stream (Port 5004)
├── client/                # React (Vite) + Tailwind CSS + Web Crypto UI (Port 5173)
├── docker-compose.yml     # Complete containerized multi-service deployment
└── package.json           # Root orchestration runner
```

---

## 2. Security & Compliance Highlights

| Security Feature | Implementation Mechanism |
| :--- | :--- |
| **WebRTC Media Security** | DTLS-SRTP native encryption with STUN & time-limited HMAC TURN credentials. |
| **Signaling Security** | JWT verified in `io.use()` handshake; Room Access Control ensures only the assigned Doctor & Patient can join. |
| **E2EE Data Channel** | Web Crypto API ephemeral **ECDH (P-256)** key exchange deriving an AES-GCM 256-bit symmetric key; 6-digit **Safety Fingerprint** for MITM verification. |
| **EHR Field-Level Encryption** | AES-256-GCM encryption with 96-bit initialization vectors (`iv`) and authentication tags (`authTag`). |
| **Tamper-Evident Audit Chain** | Cryptographically chained SHA-256 block logs ($\text{hash} = \text{SHA-256}(\text{previousHash} + \dots)$) with cryptographic verification endpoint. |
| **Account Protection** | 15-minute short-lived JWTs, rotating refresh tokens, 5-attempt account lockout, 15-minute inactivity session timeout. |
| **Clinical Interoperability** | ICD-10 diagnosis coding, drug-allergy conflict checking, and HL7 FHIR R4 Bundle export. |

---

## 3. Quick Start Guide

### Prerequisites
- Node.js (v18+)
- MongoDB (Running on `mongodb://localhost:27017` or via Docker Compose)

### 1. Install Dependencies
Run the install command across all microservices and the client:
```bash
npm run install:all
```

### 2. Seed Initial Clinical Demo Accounts
Populate the database with verified doctors, patient profiles, and medical records:
```bash
npm run seed
```

**Preloaded Demo Credentials:**
- **Physician (Cardiologist)**: `dr.chen@telehealth.com` / `Doctor123!`
- **Physician (Pulmonologist)**: `dr.patel@telehealth.com` / `Doctor123!`
- **Patient**: `john.doe@patient.com` / `Patient123!`
- **Compliance Administrator**: `admin@telehealth.com` / `AdminPass123!`

### 3. Start All Services Concurrently
Launch the entire microservices mesh with one command:
```bash
npm run dev
```

The portal will be accessible at: **`http://localhost:5173`**
API Gateway reverse proxy running at: **`http://localhost:5000`**

---

## 4. Key Workflows to Test

1. **Pre-Call Diagnostics & Virtual Waiting Room**:
   - Log in as Patient (`john.doe@patient.com`), join consultation room.
   - Run the Camera & Microphone level diagnostic test and test speaker chime.
   - Enter room $\rightarrow$ placed in the **Virtual Waiting Room**.
   - Log in as Doctor in another window $\rightarrow$ receive **"Patient Arrived"** alert and click **Admit to Consultation**.
2. **E2EE Key Agreement & Safety Fingerprint**:
   - Both sides exchange ECDH P-256 public keys and derive an AES-GCM shared key.
   - Compare the **6-digit Safety Fingerprint** displayed in the room.
   - Send messages through the in-call chat $\rightarrow$ verified AES-256 encryption.
3. **Real-time Biometric Vitals & Anomaly Escalation**:
   - In the Patient or Doctor dashboard, start the **IoT Wearable Device Simulator**.
   - Switch mode to **Tachycardia** or **Hypoxemia** $\rightarrow$ observe instant threshold alert badge and escalation notification to the clinician.
4. **Encrypted EHR & Drug-Allergy Conflict Detection**:
   - In the Doctor dashboard, click **New Clinical Record**.
   - Select medication: if prescribing Penicillin or Amoxicillin to John Doe (who has a documented penicillin allergy), observe the **CRITICAL ALLERGY CONFLICT** warning.
   - Save record $\rightarrow$ verified with AES-256-GCM encryption.
5. **Tamper-Evident Hash-Chained Audit Trail**:
   - Log in as Admin (`admin@telehealth.com`).
   - Open Audit Trail tab $\rightarrow$ click **Verify Cryptographic Integrity** to validate every chained SHA-256 block hash.
   - Export Patient records to **HL7 FHIR R4 Bundle (JSON)**.
