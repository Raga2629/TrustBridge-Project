/**
 * TrustBridge Fake Review Detection
 *
 * Combines:
 *   1. trustbridge_fake_review_model.pkl  (Python ML microservice :8000)
 *   2. Rule-based spam / quality checks
 *
 * Binary outcome:  approve → "verified"  |  reject → "rejected"
 *
 * REJECTION thresholds (tuned after testing):
 *   - ML fake probability > 0.60  alone  → reject
 *   - ML fake probability > 0.45  + any rule flag → reject
 *   - Any hard rule (duplicate / spam keyword / promotional) → reject
 *   - 2+ soft rules triggered → reject
 */
import natural from 'natural';
import axios   from 'axios';

const { WordTokenizer } = natural;
const tokenizer = new WordTokenizer();

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// ─── 1. ML model ──────────────────────────────────────────────────────────────
async function callMLModel(text) {
  try {
    const { data } = await axios.post(
      `${ML_SERVICE_URL}/predict`,
      { text },
      { timeout: 5000 }
    );
    return {
      prediction:        data.prediction,        // 'fake' | 'genuine'
      fakeProbability:   data.fake_probability,
      genuineProbability:data.genuine_probability,
      confidence:        data.confidence,
      modelAvailable:    data.model_available,
    };
  } catch (err) {
    console.warn('[FakeDetection] ML service unreachable:', err.message);
    return {
      prediction: 'unknown', fakeProbability: 0,
      genuineProbability: 1, confidence: 0, modelAvailable: false,
    };
  }
}

// ─── 1b. Relevance check ──────────────────────────────────────────────────────
export async function checkRelevance(reviewText, serviceName, serviceCategory, serviceDescription = '') {
  try {
    const { data } = await axios.post(
      `${ML_SERVICE_URL}/relevance`,
      {
        review_text:         reviewText,
        service_name:        serviceName,
        service_category:    serviceCategory,
        service_description: serviceDescription || '',
      },
      { timeout: 5000 }
    );
    return {
      isRelevant:     data.is_relevant,
      similarityScore:data.similarity_score,
      threshold:      data.threshold,
      reason:         data.reason,
    };
  } catch (err) {
    console.warn('[Relevance] Service unreachable — skipping:', err.message);
    // Fail open — don't block reviews if ML service is temporarily down
    return { isRelevant: true, similarityScore: 0, threshold: 0, reason: 'check_skipped' };
  }
}

// ─── 2. Rule-based checks ─────────────────────────────────────────────────────
const SPAM_KEYWORDS = [
  'fake','scam','bot','spam','click here','buy now','free money',
  'guaranteed','lorem ipsum','test review','asdf','qwerty','xxx',
];

// Promotional / exaggerated language patterns
const PROMOTIONAL_PATTERNS = [
  /\b(100%|best ever|must visit|go now|hurry|limited offer)\b/i,
  /\b(best .{0,20} in (hyderabad|india|world|the city|the country|the universe|existence))\b/i,
  /\b(nothing (comes|even comes) close)\b/i,
  /\b(hundreds of (restaurants|places|shops))\b/i,
  /\b(visited .{0,10} (hundreds|thousands))\b/i,
  /\b(single best|number one|beyond all expectations)\b/i,
  /\b(never .{0,20} anything (so|this) (incredible|amazing|perfect))\b/i,
  /\b(greatest .{0,15} (on|in) (the|this) (planet|world|city|universe))\b/i,
  /\b(absolutely (perfect|incredible|amazing) every (time|single))\b/i,
  /\b(changed my life|life changing|life-changing)\b/i,
  /\b(pure perfection|every bite was|every dish was)\b/i,
  /\b(best .{0,10} (in the universe|on earth|on the planet|that (has ever|ever) existed))\b/i,
  /\b(nothing else comes close|nothing has ever come close)\b/i,
  /\b(masterpiece|beyond description|beyond all words)\b/i,
];

// User-facing rejection reasons — priority order
const REASONS = {
  DUPLICATE:      'Duplicate review detected',
  NEAR_DUPLICATE: 'Near-duplicate content detected',
  SPAM_KEYWORD:   'Promotional spam detected',
  PROMOTIONAL:    'Exaggerated or promotional language detected',
  EXCESSIVE_PUNCT:'Excessive punctuation detected',
  EMOJI_SPAM:     'Emoji spam detected',
  REPEATED_WORDS: 'Repeated words detected',
  ALL_CAPS:       'ALL CAPS text detected',
  MEANINGLESS:    'Meaningless content detected',
  TOO_SHORT:      'Review is too short',
  ML_FAKE:        'Suspicious review pattern detected',
};

function runRuleChecks(content, existingReviews = []) {
  const flags  = [];
  const lower  = content.toLowerCase().trim();
  const words  = lower.split(/\s+/).filter(Boolean);
  const unique = new Set(words);

  // ── HARD rules ─────────────────────────────────────────────────────────────

  // Duplicate / near-duplicate
  for (const existing of existingReviews) {
    const el = existing.toLowerCase().trim();
    if (el === lower) { flags.push(REASONS.DUPLICATE); break; }
    if (jaccardSimilarity(lower, el) > 0.8) { flags.push(REASONS.NEAR_DUPLICATE); break; }
  }

  // Spam keywords
  if (SPAM_KEYWORDS.some(kw => lower.includes(kw)))
    flags.push(REASONS.SPAM_KEYWORD);

  // Promotional / exaggerated language
  if (PROMOTIONAL_PATTERNS.some(p => p.test(content)))
    flags.push(REASONS.PROMOTIONAL);

  // ── SOFT rules ─────────────────────────────────────────────────────────────

  // Excessive punctuation (3+ consecutive ! or ?)
  if (/[!?]{3,}/.test(content))
    flags.push(REASONS.EXCESSIVE_PUNCT);

  // Emoji spam (5+)
  const emojiCount = (content.match(
    /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{1F900}-\u{1F9FF}]/gu
  ) || []).length;
  if (emojiCount >= 5)
    flags.push(REASONS.EMOJI_SPAM);

  // Repeated words > 55% repetition
  if (words.length > 5 && unique.size / words.length < 0.45)
    flags.push(REASONS.REPEATED_WORDS);

  // ALL CAPS
  const letters = content.replace(/[^a-zA-Z]/g, '');
  if (letters.length > 15 && letters === letters.toUpperCase())
    flags.push(REASONS.ALL_CAPS);

  // Meaningless content (avg word length < 2.5)
  const avgWordLen = words.reduce((s, w) => s + w.length, 0) / (words.length || 1);
  if (words.length > 3 && avgWordLen < 2.5)
    flags.push(REASONS.MEANINGLESS);

  // Too short
  if (lower.length < 10)
    flags.push(REASONS.TOO_SHORT);

  const ruleScore = Math.min(100, flags.length * 20);
  const isDuplicate = flags.includes(REASONS.DUPLICATE) || flags.includes(REASONS.NEAR_DUPLICATE);

  return { flags, ruleScore, isDuplicate };
}

function jaccardSimilarity(a, b) {
  const setA = new Set(tokenizer.tokenize(a) || []);
  const setB = new Set(tokenizer.tokenize(b) || []);
  const intersection = [...setA].filter(x => setB.has(x)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

// ─── 3. Combined decision — binary only ───────────────────────────────────────
const HARD_REASONS = [
  REASONS.DUPLICATE, REASONS.NEAR_DUPLICATE,
  REASONS.SPAM_KEYWORD, REASONS.PROMOTIONAL,
];

function makeDecision(flags, mlResult) {
  const hardTriggered = flags.some(f => HARD_REASONS.includes(f));
  const softFlags     = flags.filter(f => !HARD_REASONS.includes(f));
  const softCount     = softFlags.length;
  const fakePct       = mlResult.fakeProbability;

  // Pick best user-facing reason
  const reason = flags[0] || (fakePct > 0.60 ? REASONS.ML_FAKE : '');

  // Hard rule alone → always reject
  if (hardTriggered)
    return { decision: 'reject', reason };

  // ML very confident (>60%) alone → reject
  if (fakePct > 0.60)
    return { decision: 'reject', reason: reason || REASONS.ML_FAKE };

  // ML moderately suspicious (>45%) + any rule flag → reject
  if (fakePct > 0.45 && softCount >= 1)
    return { decision: 'reject', reason: softFlags[0] || REASONS.ML_FAKE };

  // 2+ soft rule flags → reject
  if (softCount >= 2)
    return { decision: 'reject', reason: softFlags[0] };

  return { decision: 'approve', reason: '' };
}

// ─── 4. Trust score (0–100, higher = more trustworthy, admin-only) ────────────
function calcTrustScore(fakePct, ruleScore, isDuplicate) {
  let score = 100;
  score -= Math.round(fakePct * 60);         // ML signal: up to -60
  score -= Math.round((ruleScore / 100) * 30); // Rules: up to -30
  if (isDuplicate) score -= 20;
  return Math.max(0, Math.min(100, Math.round(score)));
}

// ─── Public API ───────────────────────────────────────────────────────────────
export async function analyzeReview(content, existingReviews = [], userActivity = {}) {
  const [mlResult, ruleResult] = await Promise.all([
    callMLModel(content),
    Promise.resolve(runRuleChecks(content, existingReviews)),
  ]);

  const riskScore  = Math.round(ruleResult.ruleScore * 0.4 + mlResult.fakeProbability * 100 * 0.6);
  const trustScore = calcTrustScore(mlResult.fakeProbability, ruleResult.ruleScore, ruleResult.isDuplicate);
  const { decision, reason } = makeDecision(ruleResult.flags, mlResult);

  // ── Debug logging (visible in backend console during testing) ─────────────
  console.log('\n[FakeDetection] ─────────────────────────────────────');
  console.log('[FakeDetection] Text      :', content.slice(0, 100));
  console.log('[FakeDetection] ML Pred   :', mlResult.prediction, `(fake=${(mlResult.fakeProbability*100).toFixed(1)}%, confidence=${(mlResult.confidence*100).toFixed(1)}%)`);
  console.log('[FakeDetection] Model OK  :', mlResult.modelAvailable);
  console.log('[FakeDetection] Spam Flags:', ruleResult.flags.length ? ruleResult.flags.join(', ') : 'none');
  console.log('[FakeDetection] Rule Score:', ruleResult.ruleScore, '/ 100');
  console.log('[FakeDetection] Risk Score:', riskScore, '/ 100');
  console.log('[FakeDetection] Trust Score:', trustScore, '/ 100');
  console.log('[FakeDetection] Decision  :', decision.toUpperCase(), reason ? `— ${reason}` : '');
  console.log('[FakeDetection] ─────────────────────────────────────\n');

  return {
    status:   decision === 'approve' ? 'verified' : 'rejected',
    decision,
    reason,
    // Admin-only
    mlPrediction:      mlResult.prediction,
    mlFakeProbability: mlResult.fakeProbability,
    mlConfidence:      mlResult.confidence,
    mlModelAvailable:  mlResult.modelAvailable,
    ruleScore:         ruleResult.ruleScore,
    spamFlags:         ruleResult.flags,
    isDuplicate:       ruleResult.isDuplicate,
    riskScore,
    trustScore,
    // Legacy compat
    mlScore:           Math.round(mlResult.fakeProbability * 100),
    fakeProbability:   mlResult.fakeProbability,
    genuineProbability:mlResult.genuineProbability,
    reasons:           ruleResult.flags,
  };
}
