import validator from 'validator';

export const validateAadhaar = (aadhaar) => {
  const cleaned = aadhaar.replace(/\s/g, '');
  if (!/^\d{12}$/.test(cleaned)) return { valid: false, score: 0, reason: 'Invalid Aadhaar format' };
  const digits = cleaned.split('').map(Number);
  const checksum = digits.pop();
  const weights = [2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1];
  let sum = 0;
  for (let i = 0; i < 11; i++) {
    let prod = digits[i] * weights[i];
    sum += prod > 9 ? prod - 9 : prod;
  }
  const expected = (10 - (sum % 10)) % 10;
  return {
    valid: expected === checksum,
    score: expected === checksum ? 25 : 0,
    reason: expected === checksum ? 'Valid Aadhaar' : 'Invalid Aadhaar checksum',
  };
};

export const validateGST = (gst) => {
  const pattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  const valid = pattern.test(gst?.toUpperCase());
  return {
    valid,
    score: valid ? 25 : 0,
    reason: valid ? 'Valid GST format' : 'Invalid GST format',
  };
};

export const nameMatch = (name1, name2) => {
  if (!name1 || !name2) return { match: false, score: 0 };
  const normalize = (s) => s.toLowerCase().replace(/[^a-z\s]/g, '').trim();
  const n1 = normalize(name1);
  const n2 = normalize(name2);
  const words1 = new Set(n1.split(/\s+/));
  const words2 = new Set(n2.split(/\s+/));
  const intersection = [...words1].filter((w) => words2.has(w));
  const ratio = intersection.length / Math.max(words1.size, words2.size);
  return {
    match: ratio >= 0.5,
    score: Math.round(ratio * 25),
    ratio,
  };
};

export const simulateOCR = (docType, providedData) => {
  return {
    name: providedData.fullName || providedData.name || '',
    gstNumber: providedData.gstNumber || '',
    businessName: providedData.businessName || '',
    confidence: 0.85 + Math.random() * 0.1,
    docType,
  };
};

export const simulateFaceMatch = () => {
  const score = 75 + Math.random() * 23;
  return {
    score: Math.round(score * 100) / 100,
    matched: score >= 70,
    confidence: score / 100,
  };
};

export const calculateProviderVerificationScore = (data, ocrData) => {
  let score = 0;
  const reasons = [];

  const aadhaarResult = validateAadhaar(data.aadhaarNumber);
  score += aadhaarResult.score;
  reasons.push(aadhaarResult.reason);

  if (data.gstNumber) {
    const gstResult = validateGST(data.gstNumber);
    score += gstResult.score;
    reasons.push(gstResult.reason);
  } else {
    score += 10;
    reasons.push('No GST provided - partial score');
  }

  const nameResult = nameMatch(data.fullName, ocrData.name);
  score += nameResult.score;
  reasons.push(nameResult.match ? 'Name matches OCR' : 'Name mismatch with OCR');

  const bizResult = nameMatch(data.businessName, ocrData.businessName);
  score += bizResult.score;
  reasons.push(bizResult.match ? 'Business name matches' : 'Business name mismatch');

  if (data.documents?.aadhaar) score += 15;
  if (data.documents?.gstCertificate) score += 10;
  if (data.documents?.businessLicense) score += 10;

  if (validator.isMobilePhone(data.phone, 'en-IN')) {
    score += 5;
    reasons.push('Valid phone number');
  }

  let status = 'rejected';
  if (score > 80) status = 'auto_approved';
  else if (score >= 60) status = 'manual_review';

  return { score: Math.min(100, score), status, reasons };
};
