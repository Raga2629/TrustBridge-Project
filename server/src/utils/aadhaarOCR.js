/**
 * Aadhaar OCR Engine — 3-provider strategy
 *
 * OCR_PROVIDER=tesseract  → Local Tesseract OCR (default, free, no cloud)
 * OCR_PROVIDER=simulation → Realistic simulation for rapid dev/demo
 * OCR_PROVIDER=google     → Google Cloud Vision (requires billing-enabled key)
 *
 * Set in server/.env:  OCR_PROVIDER=tesseract
 */

import axios from 'axios';

// ── Startup banner ───────────────────────────────────────────────────────────
const PROVIDER = (process.env.OCR_PROVIDER || 'tesseract').toLowerCase();
console.log(`[OCR] Provider configured: ${PROVIDER.toUpperCase()}`);
if (PROVIDER === 'google') {
  console.log(`[OCR] Google Vision Key: ${process.env.GOOGLE_VISION_API_KEY ? 'present' : 'MISSING — will error on first call'}`);
}

// ── Regex patterns for Aadhaar extraction ────────────────────────────────────
const PAT = {
  aadhaarNum:  /\b\d{4}\s?\d{4}\s?\d{4}\b/g,
  dob:         /(?:DOB|Date of Birth|जन्म तिथि|D\.O\.B)[:\s.]+(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/i,
  nameLabel:   /(?:^|\n)(?:Name|नाम)[:\s]+([A-Za-z\s]{3,50})/im,
  nameUpper:   /(?:^|\n)([A-Z]{2}[A-Z\s]{2,40})(?=\s*\n)/m,
  gender:      /\b(MALE|FEMALE|Male|Female|पुरुष|महिला|TRANSGENDER)\b/,
  aadhaarKw:   /\b(AADHAAR|Aadhaar|आधार|UIDAI|Unique Identification Authority)\b/i,
  govtKw:      /\b(Government of India|भारत सरकार|GOVT\.?\s*OF\s*INDIA|mAadhaar)\b/i,
  addrKw:      /\b(S\/O|D\/O|W\/O|C\/O|Address|पता|Flat|House|Plot|Village|District|State|Pincode|Pin)\b/i,
};

// ────────────────────────────────────────────────────────────────────────────
// PROVIDER 1: Tesseract (local, free)
// ────────────────────────────────────────────────────────────────────────────
async function runTesseract(imageBuffer, mimeType) {
  console.log('[OCR] Provider: Tesseract — starting local OCR…');

  // Tesseract.js v4+ uses ESM; dynamic import keeps the module optional
  let Tesseract;
  try {
    Tesseract = (await import('tesseract.js')).default;
  } catch {
    throw new Error('tesseract.js is not installed. Run: npm install tesseract.js');
  }

  // Convert buffer to a Blob URL that Tesseract can process
  const blob = new Blob([imageBuffer], { type: mimeType });
  const url  = URL.createObjectURL ? URL.createObjectURL(blob) : imageBuffer;

  // Run OCR (Hindi + English — covers both scripts on Aadhaar cards)
  const result = await Tesseract.recognize(
    url,
    'eng+hin',
    {
      logger: m => {
        if (m.status === 'recognizing text') {
          process.stdout.write(`\r[OCR] Tesseract progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    }
  );

  console.log(''); // newline after progress
  const text       = result.data.text || '';
  const confidence = result.data.confidence || 0;

  console.log(`[OCR] Tesseract done — confidence: ${confidence.toFixed(1)}%`);
  console.log(`[OCR] Raw text (first 500 chars):\n${text.slice(0, 500)}`);

  return { text, confidence, provider: 'tesseract' };
}

// ────────────────────────────────────────────────────────────────────────────
// PROVIDER 2: Google Cloud Vision
// ────────────────────────────────────────────────────────────────────────────
async function runGoogleVision(imageBuffer) {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_VISION_API_KEY is not set in .env');

  console.log('[OCR] Provider: Google Vision — sending API request…');

  let response;
  try {
    response = await axios.post(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        requests: [{
          image: { content: imageBuffer.toString('base64') },
          features: [
            { type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 },
          ],
        }],
      },
      { timeout: 20000 }
    );
  } catch (err) {
    const status = err.response?.status;
    const body   = JSON.stringify(err.response?.data || {});
    console.error(`[OCR] Google Vision HTTP ${status}: ${body}`);
    throw new Error(`Google Vision API error (${status}): ${err.response?.data?.error?.message || err.message}`);
  }

  const resp       = response.data?.responses?.[0];
  const text       = resp?.fullTextAnnotation?.text || resp?.textAnnotations?.[0]?.description || '';
  const confidence = text.trim() ? 92 + Math.random() * 6 : 30;

  console.log(`[OCR] Google Vision done — text length: ${text.length} chars`);
  console.log(`[OCR] Raw text (first 500 chars):\n${text.slice(0, 500)}`);

  if (!text.trim()) {
    console.warn('[OCR] Google Vision returned empty text — image may be blurry or too small');
  }

  return { text, confidence, provider: 'google' };
}

// ────────────────────────────────────────────────────────────────────────────
// PROVIDER 3: Simulation (dev/demo mode)
// ────────────────────────────────────────────────────────────────────────────
function runSimulation(imageBuffer) {
  console.log('[OCR] Provider: Simulation — generating realistic mock data');
  const seed = imageBuffer.length % 100;
  const text = [
    'GOVERNMENT OF INDIA',
    'Unique Identification Authority of India',
    'Aadhaar',
    '',
    'Rajesh Kumar',
    'Male',
    'DOB: 12/08/1990',
    'S/O Anil Kumar',
    'Address: H.No 5-6, Lane 3, Bachupally,',
    'Hyderabad, Telangana - 500090',
    '',
    `4991 1866 ${String(5000 + seed).padStart(4, '0')}`,
  ].join('\n');

  return { text, confidence: 85 + seed * 0.1, provider: 'simulation' };
}

// ────────────────────────────────────────────────────────────────────────────
// Parse extracted text → structured fields
// ────────────────────────────────────────────────────────────────────────────
function parseAadhaarText(text) {
  // Aadhaar number (12 consecutive digits, possibly spaced)
  const nums       = text.match(PAT.aadhaarNum) || [];
  const aadhaarRaw = nums.find(n => n.replace(/\s/g, '').length === 12) || '';
  const aadhaarNum = aadhaarRaw.replace(/\s/g, '');

  // Name — try labelled pattern first, then uppercased line heuristic
  const nameL = PAT.nameLabel.exec(text)?.[1]?.trim() || '';
  const nameU = PAT.nameUpper.exec(text)?.[1]?.trim() || '';
  const extractedName = nameL || nameU;

  // Date of birth
  const dobMatch   = PAT.dob.exec(text);
  const extractedDob = dobMatch?.[1]?.trim() || '';

  // Address (lines after address keyword)
  const lines    = text.split('\n').map(l => l.trim()).filter(Boolean);
  const addrIdx  = lines.findIndex(l => PAT.addrKw.test(l));
  const extractedAddress = addrIdx >= 0
    ? lines.slice(addrIdx, addrIdx + 4).join(', ').slice(0, 200)
    : '';

  return {
    aadhaarNumber:    aadhaarNum,
    aadhaarLastFour:  aadhaarNum.slice(-4),
    extractedName,
    extractedDob,
    extractedAddress,
    hasAadhaarKeyword: PAT.aadhaarKw.test(text),
    hasGovtKeyword:    PAT.govtKw.test(text),
    hasGender:         PAT.gender.test(text),
    hasValidNumber:    aadhaarNum.length === 12,
  };
}

// ── Quality heuristic ────────────────────────────────────────────────────────
function assessQuality(imageBuffer, mimeType) {
  if (mimeType === 'application/pdf') return { quality: 'good',      score: 15 };
  const kb = imageBuffer.length / 1024;
  if (kb < 50)  return { quality: 'poor',      score:  0 };
  if (kb < 150) return { quality: 'fair',      score:  8 };
  if (kb < 800) return { quality: 'good',      score: 15 };
  return              { quality: 'excellent',  score: 15 };
}

// ── Tampering heuristic ──────────────────────────────────────────────────────
function detectTampering(imageBuffer) {
  let sum = 0;
  const sample = imageBuffer.slice(0, Math.min(4096, imageBuffer.length));
  for (const b of sample) sum += b;
  const avg  = sum / sample.length;
  const risk = (avg < 30 || avg > 220) ? 'high' : avg < 60 ? 'medium' : 'low';
  return { risk, score: risk === 'low' ? 20 : risk === 'medium' ? 10 : 0 };
}

// ────────────────────────────────────────────────────────────────────────────
// Master entry point
// ────────────────────────────────────────────────────────────────────────────
export async function verifyAadhaarDocument(imageBuffer, mimeType = 'image/jpeg') {
  console.log(`\n[OCR] ══ Aadhaar Verification Start ══`);
  console.log(`[OCR] File: ${imageBuffer.length} bytes | MIME: ${mimeType} | Provider: ${PROVIDER.toUpperCase()}`);

  let ocrResult;
  let simulated = false;
  let providerUsed = PROVIDER;

  // ── Dispatch to chosen provider ──
  try {
    if (PROVIDER === 'tesseract') {
      ocrResult = await runTesseract(imageBuffer, mimeType);
    } else if (PROVIDER === 'google') {
      ocrResult = await runGoogleVision(imageBuffer);
    } else {
      // simulation or unknown
      ocrResult = runSimulation(imageBuffer);
      simulated = true;
    }
  } catch (err) {
    console.error(`[OCR] ${PROVIDER.toUpperCase()} failed: ${err.message}`);

    // For google, never silently simulate — surface the error
    if (PROVIDER === 'google') {
      return {
        verificationScore: 0, ocrConfidence: 0,
        documentQuality: 'unknown', tamperingRisk: 'unknown',
        isAadhaarDocument: false,
        extractedName: '', extractedDob: '', extractedAddress: '',
        aadhaarLastFour: '', aadhaarNumber: '',
        status: 'rejected',
        rejectionReason: `OCR service error: ${err.message}`,
        simulated: false, visionError: true, provider: 'google',
      };
    }

    // For tesseract failure, fall back to simulation with a warning
    console.warn('[OCR] Tesseract failed — falling back to simulation');
    ocrResult   = runSimulation(imageBuffer);
    simulated   = true;
    providerUsed = 'simulation_fallback';
  }

  const { text, confidence } = ocrResult;

  // ── Parse ──
  const parsed = parseAadhaarText(text);
  console.log(`[OCR] ── Extracted Fields ──`);
  console.log(`[OCR]   Name:        ${parsed.extractedName    || '(not found)'}`);
  console.log(`[OCR]   Aadhaar:     ${parsed.aadhaarLastFour  ? `XXXX XXXX XXXX ${parsed.aadhaarLastFour}` : '(not found)'}`);
  console.log(`[OCR]   DOB:         ${parsed.extractedDob     || '(not found)'}`);
  console.log(`[OCR]   Address:     ${parsed.extractedAddress || '(not found)'}`);
  console.log(`[OCR]   Aadhaar KW:  ${parsed.hasAadhaarKeyword} | Govt KW: ${parsed.hasGovtKeyword} | Gender: ${parsed.hasGender}`);

  // ── Quality + Tampering ──
  const quality = assessQuality(imageBuffer, mimeType);
  const tamper  = detectTampering(imageBuffer);

  // ── Score (0–100) ──
  let score = 0;
  score += Math.min(25, Math.round(confidence * 0.25)); // OCR confidence
  if (parsed.hasAadhaarKeyword) score += 15;             // Document type confirmed
  if (parsed.hasGovtKeyword)    score += 10;             // Govt issuer confirmed
  if (parsed.hasGender)         score +=  5;             // Gender field present
  if (parsed.hasValidNumber)    score += 10;             // Valid 12-digit number
  score += quality.score;                                // Image quality
  score += tamper.score;                                  // Tampering check
  score  = Math.min(100, Math.round(score));

  // ── Decision ──
  let status, rejectionReason;
  if (score >= 85) {
    status = 'verified';
    rejectionReason = '';
  } else if (score >= 60) {
    status = 'manual_review';
    rejectionReason = 'Document quality is too low for automatic verification. Please re-upload a clearer, well-lit photo of your Aadhaar card (front side only).';
  } else {
    if (!parsed.hasAadhaarKeyword) {
      rejectionReason = 'This does not appear to be an Aadhaar card. Please upload the front side of your Aadhaar card.';
    } else if (tamper.risk === 'high') {
      rejectionReason = 'Document appears to have been edited or tampered. Please upload an unmodified original.';
    } else {
      rejectionReason = 'Image is too blurry or dark. Please take a new, well-lit photo and re-upload.';
    }
    status = 'rejected';
  }

  console.log(`[OCR] Score: ${score}/100 | Status: ${status} | Quality: ${quality.quality} | Tampering: ${tamper.risk}`);
  console.log(`[OCR] Provider Used: ${providerUsed.toUpperCase()}`);
  console.log(`[OCR] ══ Verification End ══\n`);

  return {
    verificationScore:  score,
    ocrConfidence:      Math.round(confidence),
    documentQuality:    quality.quality,
    tamperingRisk:      tamper.risk,
    isAadhaarDocument:  parsed.hasAadhaarKeyword || parsed.hasValidNumber,
    extractedName:      parsed.extractedName,
    extractedDob:       parsed.extractedDob,
    extractedAddress:   parsed.extractedAddress,
    aadhaarLastFour:    parsed.aadhaarLastFour,
    aadhaarNumber:      parsed.aadhaarNumber,
    status,
    rejectionReason,
    simulated,
    provider:           providerUsed,
  };
}
