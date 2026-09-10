import express from 'express'
import mongoose from 'mongoose'
import crypto from 'node:crypto'
import cors from 'cors'
import dotenv from 'dotenv'
import XLSX from 'xlsx'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5001
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cesta'

app.use(cors())
app.use(express.json())

// MongoDB Schema for Trader accounts (real registrations, admin-approved)
const traderSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  mobile: { type: String, required: true, trim: true },
  password: { type: String, required: true }, // plain text by design (internal project)
  organisationName: { type: String, default: '', trim: true },
  termsAccepted: { type: Boolean, default: false },
  mobileVerified: { type: Boolean, default: false },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  otp: { type: String, default: '' },
  otpExpiresAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date, default: null }
})

let TraderModel = null
// In-memory fallback for traders (used only when MongoDB is unavailable)
const memoryTraders = []

// MongoDB Schema for Bid
const bidSchema = new mongoose.Schema({
  lotId: { type: String, required: true },
  lotName: { type: String, required: true },
  lotImageUrl: { type: String, default: '' },
  bidAmount: { type: Number, required: true },
  floorPrice: { type: Number, default: 0 },
  mrp: { type: Number, default: 0 },
  userEmail: { type: String, required: true },
  userName: { type: String, default: 'Trader' },
  timestamp: { type: Date, default: Date.now },
  endDate: { type: String, default: '' }
})

let BidModel = null
let isMongoConnected = false

// MongoDB Schema for Price Config (global pricing settings shared across all devices)
const RANGE_STEP = 5000
const RANGE_MIN = 10000
const RANGE_MAX = 200000

// Build the default contiguous bands: 10000-15000, 15000-20000, ... 195000-200000 (all 0% hike).
// Prices inside a band use that band's custom percent ONLY when it is explicitly set (> 0);
// every other price (below 10k, above 2 lakh, or in a 0% band) uses the global default hike.
function buildDefaultRanges() {
  const ranges = []
  for (let min = RANGE_MIN; min < RANGE_MAX; min += RANGE_STEP) {
    ranges.push({ min, max: min + RANGE_STEP, percent: 0 })
  }
  return ranges
}

// Detect the legacy default config (0-100000 bands, all zero percent) so it can be
// migrated to the new defaults without losing any custom percent a user saved.
function isLegacyDefaultRanges(ranges) {
  if (!Array.isArray(ranges) || ranges.length !== 20) return false
  return ranges.every((r, i) => Number(r.min) === i * 5000 && Number(r.max) === (i + 1) * 5000 && Number(r.percent) === 0)
}

const priceConfigSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, default: 'global' },
  priceHike: { type: Number, default: 0, min: 0, max: 100 },
  // Range-wise hikes: [{ min, max, percent }] applied by item price band
  rangeHikes: {
    type: [{
      min: { type: Number, required: true, min: 0 },
      max: { type: Number, required: true, min: 0 },
      percent: { type: Number, required: true, min: 0, max: 100 }
    }],
    default: buildDefaultRanges
  },
  updatedAt: { type: Date, default: Date.now }
})

let PriceConfigModel = null

// In-memory fallback for price config (used when MongoDB is unavailable)
let memoryPriceConfig = { priceHike: 0, rangeHikes: buildDefaultRanges() }

mongoose.set('strictQuery', false)
if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
    .then(() => {
      console.log('MongoDB connected successfully')
      isMongoConnected = true
      BidModel = mongoose.model('Bid', bidSchema)
      PriceConfigModel = mongoose.model('PriceConfig', priceConfigSchema)
      TraderModel = mongoose.model('Trader', traderSchema)
    })
    .catch((err) => {
      console.warn('MongoDB connection notice (using in-memory bid store):', err.message)
    })
}

// Get the full pricing config (DB first, memory fallback)
async function getPriceConfig() {
  if (isMongoConnected && PriceConfigModel) {
    try {
      let config = await PriceConfigModel.findOne({ key: 'global' }).lean()
      if (!config) {
        // First run: seed the document with the in-memory value
        config = await PriceConfigModel.create({
          key: 'global',
          priceHike: memoryPriceConfig.priceHike,
          rangeHikes: memoryPriceConfig.rangeHikes
        }).then((doc) => doc.toObject()).catch(() => null)
      }
      if (config) {
        memoryPriceConfig.priceHike = typeof config.priceHike === 'number' ? config.priceHike : 0
        let stored = Array.isArray(config.rangeHikes) && config.rangeHikes.length
          ? config.rangeHikes
          : buildDefaultRanges()
        // One-time migration: legacy default (0-100k bands) -> new default (10k-2L bands)
        if (isLegacyDefaultRanges(stored)) {
          stored = buildDefaultRanges()
          PriceConfigModel.findOneAndUpdate(
            { key: 'global' },
            { rangeHikes: stored, updatedAt: new Date() },
            { upsert: true }
          ).catch((e) => console.error('Price config migration save error:', e))
        }
        memoryPriceConfig.rangeHikes = stored
      }
      return { priceHike: memoryPriceConfig.priceHike, rangeHikes: memoryPriceConfig.rangeHikes }
    } catch (e) {
      console.error('Price config DB query error, falling back to memory:', e)
    }
  }
  return { priceHike: memoryPriceConfig.priceHike, rangeHikes: memoryPriceConfig.rangeHikes }
}

// Keep the old helper working (global default hike)
async function getPriceHike() {
  const config = await getPriceConfig()
  return config.priceHike
}

// Calculate hiked price based on global priceHike or matching range band
function applyPriceHikeToNumber(price, priceHike = 0, rangeHikes = []) {
  const numPrice = Number(price)
  if (isNaN(numPrice) || numPrice <= 0) return price
  let percent = priceHike
  if (Array.isArray(rangeHikes) && rangeHikes.length > 0) {
    const band = rangeHikes.find((r) => numPrice >= Number(r.min) && numPrice < Number(r.max))
    // Only a band with an explicitly configured percent (> 0) overrides the global hike;
    // default zero-percent bands must not cancel out the global priceHike.
    if (band && Number(band.percent) > 0) {
      percent = Number(band.percent)
    }
  }
  const hiked = percent > 0 ? numPrice * (1 + percent / 100) : numPrice
  return Math.round(hiked)
}

// Validate a rangeHikes array: numbers, sane bounds, non-overlapping ascending bands
function sanitizeRangeHikes(ranges) {
  if (!Array.isArray(ranges) || ranges.length === 0) {
    throw new Error('rangeHikes must be a non-empty array')
  }
  const cleaned = ranges.map((r) => ({
    min: Number(r.min),
    max: Number(r.max),
    percent: Number(r.percent)
  }))
  for (const r of cleaned) {
    if (!Number.isFinite(r.min) || !Number.isFinite(r.max) || !Number.isFinite(r.percent)) {
      throw new Error('Each range needs numeric min, max and percent')
    }
    if (r.min < 0 || r.max <= r.min) {
      throw new Error('Each range needs 0 <= min < max')
    }
    if (r.percent < 0 || r.percent > 100) {
      throw new Error('Each range percent must be between 0 and 100')
    }
  }
  cleaned.sort((a, b) => a.min - b.min)
  for (let i = 1; i < cleaned.length; i++) {
    if (cleaned[i].min < cleaned[i - 1].max) {
      throw new Error(`Ranges must not overlap: ${JSON.stringify(cleaned[i - 1])} and ${JSON.stringify(cleaned[i])}`)
    }
  }
  return cleaned
}

// Save the pricing config (DB + memory cache)
async function savePriceConfig({ priceHike, rangeHikes }) {
  if (priceHike !== undefined) {
    const num = Number(priceHike)
    if (isNaN(num) || num < 0 || num > 100) {
      throw new Error('priceHike must be a number between 0 and 100')
    }
    memoryPriceConfig.priceHike = num
  }
  if (rangeHikes !== undefined) {
    memoryPriceConfig.rangeHikes = sanitizeRangeHikes(rangeHikes)
  }
  if (isMongoConnected && PriceConfigModel) {
    try {
      await PriceConfigModel.findOneAndUpdate(
        { key: 'global' },
        {
          key: 'global',
          priceHike: memoryPriceConfig.priceHike,
          rangeHikes: memoryPriceConfig.rangeHikes,
          updatedAt: new Date()
        },
        { upsert: true, new: true }
      )
    } catch (e) {
      console.error('Price config DB save error (memory value kept):', e)
    }
  }
  return { priceHike: memoryPriceConfig.priceHike, rangeHikes: memoryPriceConfig.rangeHikes }
}

// Public endpoint: every device reads the same pricing config from here
app.get('/api/price-config', async (req, res) => {
  try {
    const config = await getPriceConfig()
    res.json({ success: true, ...config })
  } catch (err) {
    console.error('Error fetching price config:', err)
    res.status(500).json({ message: 'Failed to fetch price config', error: err.message })
  }
})

// Admin endpoint: update the global pricing config (default hike and/or range hikes)
app.post('/api/admin/price-config', async (req, res) => {
  try {
    const { priceHike, rangeHikes } = req.body
    const saved = await savePriceConfig({ priceHike, rangeHikes })
    res.json({ success: true, ...saved })
  } catch (err) {
    console.error('Error saving price config:', err)
    res.status(400).json({ message: err.message || 'Failed to save price config' })
  }
})

// In-memory bid store fallback & synchronous cache
const memoryBids = []

// Helper function to get all bids
async function getAllBids() {
  if (isMongoConnected && BidModel) {
    try {
      const dbBids = await BidModel.find({}).sort({ timestamp: -1 }).lean()
      return dbBids.map(b => ({
        id: b._id.toString(),
        lotId: String(b.lotId),
        lotName: b.lotName,
        lotImageUrl: b.lotImageUrl,
        bidAmount: Number(b.bidAmount),
        floorPrice: Number(b.floorPrice || 0),
        mrp: Number(b.mrp || 0),
        userEmail: b.userEmail.toLowerCase(),
        userName: b.userName || 'Trader',
        timestamp: new Date(b.timestamp),
        endDate: b.endDate || ''
      }))
    } catch (e) {
      console.error('DB query error, falling back to memory:', e)
    }
  }
  return memoryBids
}

// Helper function to save a bid
async function saveBid(bidData) {
  const newBid = {
    id: String(Date.now() + Math.random()),
    lotId: String(bidData.lotId),
    lotName: bidData.lotName || 'Unknown Product',
    lotImageUrl: bidData.lotImageUrl || '',
    bidAmount: Number(bidData.bidAmount),
    floorPrice: Number(bidData.floorPrice || 0),
    mrp: Number(bidData.mrp || 0),
    userEmail: String(bidData.userEmail).toLowerCase().trim(),
    userName: bidData.userName || bidData.userEmail.split('@')[0],
    timestamp: new Date(),
    endDate: bidData.endDate || ''
  }

  memoryBids.push(newBid)

  if (isMongoConnected && BidModel) {
    try {
      const created = await BidModel.create({
        lotId: newBid.lotId,
        lotName: newBid.lotName,
        lotImageUrl: newBid.lotImageUrl,
        bidAmount: newBid.bidAmount,
        floorPrice: newBid.floorPrice,
        mrp: newBid.mrp,
        userEmail: newBid.userEmail,
        userName: newBid.userName,
        timestamp: newBid.timestamp,
        endDate: newBid.endDate
      })
      newBid.id = created._id.toString()
    } catch (e) {
      console.error('DB save error:', e)
    }
  }

  return newBid
}

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', mongoConnected: isMongoConnected })
})

// ---------- Trader account helpers ----------
function traderPublic(t) {
  return {
    id: t._id ? t._id.toString() : t.id,
    name: t.name,
    email: t.email,
    mobile: t.mobile,
    password: t.password,
    organisationName: t.organisationName || '',
    termsAccepted: !!t.termsAccepted,
    mobileVerified: !!t.mobileVerified,
    status: t.status,
    createdAt: t.createdAt,
    reviewedAt: t.reviewedAt
  }
}

async function findTraderByEmail(email) {
  const cleanEmail = String(email || '').toLowerCase().trim()
  if (isMongoConnected && TraderModel) {
    try {
      return await TraderModel.findOne({ email: cleanEmail }).lean()
    } catch (e) {
      console.error('Trader lookup error:', e)
    }
  }
  return memoryTraders.find(t => t.email === cleanEmail) || null
}

async function updateTrader(id, updates) {
  if (isMongoConnected && TraderModel) {
    try {
      return await TraderModel.findByIdAndUpdate(id, updates, { new: true }).lean()
    } catch (e) {
      // Invalid ObjectId format (e.g. legacy in-memory id) -> fall through to memory lookup
      if (!(e && e.name === 'CastError')) {
        console.error('Trader update error:', e)
      }
    }
  }
  const idx = memoryTraders.findIndex(t => t.id === String(id))
  if (idx !== -1) {
    memoryTraders[idx] = { ...memoryTraders[idx], ...updates }
    return memoryTraders[idx]
  }
  return null
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function maskMobile(mobile) {
  const m = String(mobile || '')
  return m.length === 10 ? `${m.slice(0, 2)}XXXXX${m.slice(7)}` : m
}

// Buyer Registration (mirrors b4traders signUp form)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, mobile, password, organisationName, termsAccepted } = req.body || {}

    // Same mandatory fields as b4traders: Name*, Mobile Number*, Password*, Terms acceptance
    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: 'Name is required' })
    }
    if (!mobile || !/^\d{10}$/.test(String(mobile).trim())) {
      return res.status(400).json({ message: 'A valid 10 digit mobile number is required' })
    }
    if (!password || String(password).length < 8) {
      return res.status(400).json({ message: 'Password must be minimum 8 characters' })
    }
    if (!termsAccepted) {
      return res.status(400).json({ message: 'You must accept the Terms and Conditions' })
    }

    const cleanEmail = String(email || '').toLowerCase().trim()
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ message: 'A valid email is required' })
    }

    const existing = await findTraderByEmail(cleanEmail)
    const otp = generateOtp()
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000)

    if (existing) {
      if (existing.mobileVerified && existing.status !== 'rejected') {
        return res.status(409).json({ message: 'An account with this email already exists' })
      }
      // Unverified (or previously rejected) signup: allow re-registration with fresh OTP
      const updates = {
        name: String(name).trim(),
        mobile: String(mobile).trim(),
        password: String(password),
        organisationName: String(organisationName || '').trim(),
        termsAccepted: true,
        status: 'pending',
        otp,
        otpExpiresAt: otpExpiry,
        createdAt: new Date(),
        reviewedAt: null
      }
      if (isMongoConnected && TraderModel) {
        await TraderModel.findByIdAndUpdate(existing._id, updates)
      } else {
        const idx = memoryTraders.findIndex(t => t.email === cleanEmail)
        memoryTraders[idx] = { ...existing, ...updates }
      }
      console.log(`[OTP] for ${cleanEmail} (${maskMobile(mobile)}): ${otp}`)
      return res.json({
        success: true,
        message: 'OTP sent to your mobile number. Please verify to complete registration.',
        devOtp: otp, // internal project: OTP surfaced for testing (no real SMS gateway)
        mobile: maskMobile(mobile)
      })
    }

    const traderData = {
      name: String(name).trim(),
      email: cleanEmail,
      mobile: String(mobile).trim(),
      password: String(password),
      organisationName: String(organisationName || '').trim(),
      termsAccepted: true,
      mobileVerified: false,
      status: 'pending',
      otp,
      otpExpiresAt: otpExpiry,
      createdAt: new Date(),
      reviewedAt: null
    }

    if (isMongoConnected && TraderModel) {
      const created = await TraderModel.create(traderData)
      traderData.id = created._id.toString()
    } else {
      traderData.id = crypto.randomUUID()
      memoryTraders.push(traderData)
    }

    console.log(`[OTP] for ${cleanEmail} (${maskMobile(mobile)}): ${otp}`)
    res.json({
      success: true,
      message: 'OTP sent to your mobile number. Please verify to complete registration.',
      devOtp: otp, // internal project: OTP surfaced for testing (no real SMS gateway)
      mobile: maskMobile(mobile)
    })
  } catch (err) {
    console.error('Registration error:', err)
    if (err && err.code === 11000) {
      return res.status(409).json({ message: 'An account with this email already exists' })
    }
    res.status(500).json({ message: 'Registration failed', error: err.message })
  }
})

// Verify mobile OTP -> registration complete, waiting for admin approval
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body || {}
    const trader = await findTraderByEmail(email)
    if (!trader) {
      return res.status(404).json({ message: 'Registration not found. Please sign up first.' })
    }
    if (trader.mobileVerified) {
      return res.json({ success: true, message: 'Mobile already verified.' })
    }
    if (!trader.otp || String(otp) !== String(trader.otp)) {
      return res.status(400).json({ message: 'Invalid OTP. Please try again.' })
    }
    if (trader.otpExpiresAt && new Date(trader.otpExpiresAt) < new Date()) {
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' })
    }
    await updateTrader(trader._id ? trader._id.toString() : trader.id, {
      mobileVerified: true,
      otp: '',
      otpExpiresAt: null
    })
    res.json({
      success: true,
      message: 'Registration complete! Your account is now awaiting admin approval. You will be able to sign in once approved.'
    })
  } catch (err) {
    console.error('OTP verification error:', err)
    res.status(500).json({ message: 'OTP verification failed', error: err.message })
  }
})

// Resend OTP
app.post('/api/auth/resend-otp', async (req, res) => {
  try {
    const { email } = req.body || {}
    const trader = await findTraderByEmail(email)
    if (!trader) {
      return res.status(404).json({ message: 'Registration not found. Please sign up first.' })
    }
    if (trader.mobileVerified) {
      return res.json({ success: true, message: 'Mobile already verified.' })
    }
    const otp = generateOtp()
    await updateTrader(trader._id ? trader._id.toString() : trader.id, {
      otp,
      otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000)
    })
    console.log(`[OTP] resent for ${trader.email}: ${otp}`)
    res.json({ success: true, message: 'A new OTP has been sent.', devOtp: otp, mobile: maskMobile(trader.mobile) })
  } catch (err) {
    console.error('Resend OTP error:', err)
    res.status(500).json({ message: 'Failed to resend OTP', error: err.message })
  }
})

// ---------- Admin: trader account management ----------
app.get('/api/admin/traders', async (req, res) => {
  try {
    let traders = []
    if (isMongoConnected && TraderModel) {
      traders = (await TraderModel.find({}).sort({ createdAt: -1 }).lean()).map(traderPublic)
    } else {
      traders = [...memoryTraders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(traderPublic)
    }
    res.json({
      success: true,
      counts: {
        total: traders.length,
        pending: traders.filter(t => t.status === 'pending').length,
        approved: traders.filter(t => t.status === 'approved').length,
        rejected: traders.filter(t => t.status === 'rejected').length
      },
      traders
    })
  } catch (err) {
    console.error('Error fetching traders:', err)
    res.status(500).json({ message: 'Failed to fetch trader accounts', error: err.message })
  }
})

app.post('/api/admin/traders/:id/status', async (req, res) => {
  try {
    const { status } = req.body || {}
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'status must be approved, rejected or pending' })
    }
    const updated = await updateTrader(req.params.id, { status, reviewedAt: new Date() })
    if (!updated) {
      return res.status(404).json({ message: 'Trader account not found' })
    }
    res.json({ success: true, trader: traderPublic(updated) })
  } catch (err) {
    console.error('Error updating trader status:', err)
    res.status(500).json({ message: 'Failed to update trader status', error: err.message })
  }
})

// Authentication Route (only admin-approved traders may sign in)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const trader = await findTraderByEmail(email)
    if (!trader || trader.password !== String(password)) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    if (!trader.mobileVerified) {
      return res.status(403).json({ message: 'Please complete mobile verification (OTP) first.', code: 'VERIFY_OTP' })
    }
    if (trader.status === 'pending') {
      return res.status(403).json({ message: 'Your account is awaiting admin approval. Please try again later.', code: 'PENDING' })
    }
    if (trader.status === 'rejected') {
      return res.status(403).json({ message: 'Your account request was rejected by the admin.', code: 'REJECTED' })
    }

    return res.json({
      success: true,
      user: {
        id: trader._id ? trader._id.toString() : trader.id,
        email: trader.email,
        name: trader.name,
        organisationName: trader.organisationName || ''
      }
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ message: 'Login failed', error: err.message })
  }
})

// Fetch the authoritative raw floor price for a lot directly from b4traders,
// so the enforced minimum never depends on what the client sends.
async function fetchRawLotFloorPrice(lotId) {
  try {
    const lotDetailsRes = await fetch(`https://www.b4traders.com/api/lot_publishes/${lotId}/lot_details`, {
      headers: { 'Accept': 'application/json, text/plain, */*' }
    })
    if (!lotDetailsRes.ok) return null
    const data = await lotDetailsRes.json()
    const summary = data?.lot_publishes?.[0] || data?.lot_publishes || data
    const raw = Number(summary?.floor_price)
    return Number.isFinite(raw) && raw > 0 ? raw : null
  } catch (err) {
    console.error('Error fetching raw lot floor price:', err.message)
    return null
  }
}

// Submit a Bid
app.post('/api/bids', async (req, res) => {
  try {
    const { lotId, lotName, lotImageUrl, bidAmount, floorPrice, mrp, userEmail, userName, endDate } = req.body || {}

    if (!lotId || !bidAmount || !userEmail) {
      return res.status(400).json({ message: 'Missing required bid parameters' })
    }

    const numBid = Number(bidAmount)
    if (isNaN(numBid) || numBid <= 0) {
      return res.status(400).json({ message: 'Bid amount must be a positive number' })
    }

    // Bids must be in multiples of 1000 (1000, 2000, 3000, ...)
    if (numBid % 1000 !== 0) {
      return res.status(400).json({ message: 'Bid amount must be in multiples of ₹1,000' })
    }

    // Enforce the HIKED floor price server-side so it is identical on every device:
    // raw floor price comes from b4traders (client value only as fallback), then the
    // admin-configured default/range hike is applied before comparing with the bid.
    const rawFloor = (await fetchRawLotFloorPrice(lotId)) ?? Number(floorPrice || 0)
    const config = await getPriceConfig()
    const hikedFloor = applyPriceHikeToNumber(rawFloor, config.priceHike, config.rangeHikes)
    if (hikedFloor > 0 && numBid < hikedFloor) {
      return res.status(400).json({
        message: `Bid amount must be at least the floor price (₹${hikedFloor.toLocaleString('en-IN')})`,
        minBid: hikedFloor
      })
    }

    const newBid = await saveBid({
      lotId,
      lotName,
      lotImageUrl,
      bidAmount: numBid,
      floorPrice: hikedFloor || Number(floorPrice || 0),
      mrp,
      userEmail,
      userName,
      endDate
    })

    // Calculate current top bid for this lot
    const allBids = await getAllBids()
    const lotBids = allBids.filter(b => String(b.lotId) === String(lotId))
    const topBid = lotBids.reduce((max, b) => (b.bidAmount > max ? b.bidAmount : max), 0)
    const isWinning = numBid === topBid

    res.status(201).json({
      success: true,
      bid: newBid,
      isWinning,
      topBidAmount: topBid
    })
  } catch (err) {
    console.error('Error submitting bid:', err)
    res.status(500).json({ message: 'Failed to submit bid', error: err.message })
  }
})

// Get Bids submitted by current logged-in user
app.get('/api/bids/my-bids', async (req, res) => {
  try {
    const email = (req.query.email || '').toLowerCase().trim()
    if (!email) {
      return res.status(400).json({ message: 'Email query parameter is required' })
    }

    const allBids = await getAllBids()

    // Group bids by lotId
    const lotGroupMap = new Map()
    for (const b of allBids) {
      const lotId = String(b.lotId)
      if (!lotGroupMap.has(lotId)) {
        lotGroupMap.set(lotId, [])
      }
      lotGroupMap.get(lotId).push(b)
    }

    const userBidsSummary = []

    for (const [lotId, bids] of lotGroupMap.entries()) {
      const userBidsForLot = bids.filter(b => b.userEmail === email)
      if (userBidsForLot.length === 0) continue

      // Highest bid by user for this lot
      const userHighestBidObj = userBidsForLot.reduce((max, b) => (b.bidAmount > max.bidAmount ? b : max), userBidsForLot[0])
      const userHighestBid = userHighestBidObj.bidAmount

      // Highest overall bid on this lot
      const topBidObj = bids.reduce((max, b) => (b.bidAmount > max.bidAmount ? b : max), bids[0])
      const topBidAmount = topBidObj.bidAmount

      // Is current user winning?
      const isWinning = userHighestBid >= topBidAmount
      const status = isWinning ? 'Winning' : 'Losing'

      userBidsSummary.push({
        lotId,
        lotName: userHighestBidObj.lotName,
        lotImageUrl: userHighestBidObj.lotImageUrl,
        userHighestBid,
        topBidAmount,
        topBidderEmail: topBidObj.userEmail,
        status,
        floorPrice: userHighestBidObj.floorPrice,
        mrp: userHighestBidObj.mrp,
        lastBidTime: userHighestBidObj.timestamp,
        endDate: userHighestBidObj.endDate
      })
    }

    // Sort by most recent bid time
    userBidsSummary.sort((a, b) => new Date(b.lastBidTime) - new Date(a.lastBidTime))

    res.json({
      success: true,
      bids: userBidsSummary
    })
  } catch (err) {
    console.error('Error fetching user bids:', err)
    res.status(500).json({ message: 'Failed to fetch user bids', error: err.message })
  }
})

// Get Bid status for a specific lot
app.get('/api/bids/lot/:lotId', async (req, res) => {
  try {
    const lotId = String(req.params.lotId)
    const email = (req.query.email || '').toLowerCase().trim()

    const allBids = await getAllBids()
    const lotBids = allBids.filter(b => String(b.lotId) === lotId)

    if (lotBids.length === 0) {
      return res.json({
        topBidAmount: 0,
        totalBidsCount: 0,
        userHighestBid: 0,
        userStatus: 'None',
        allBids: []
      })
    }

    // Sort descending by bid amount
    lotBids.sort((a, b) => b.bidAmount - a.bidAmount)

    const topBidObj = lotBids[0]
    const topBidAmount = topBidObj.bidAmount

    let userHighestBid = 0
    let userStatus = 'None'

    if (email) {
      const userBids = lotBids.filter(b => b.userEmail === email)
      if (userBids.length > 0) {
        userHighestBid = Math.max(...userBids.map(b => b.bidAmount))
        userStatus = userHighestBid >= topBidAmount ? 'Winning' : 'Losing'
      }
    }

    res.json({
      topBidAmount,
      topBidderEmail: topBidObj.userEmail,
      totalBidsCount: lotBids.length,
      userHighestBid,
      userStatus,
      allBids: lotBids.map(b => ({
        id: b.id,
        userEmail: b.userEmail,
        userName: b.userName,
        bidAmount: b.bidAmount,
        timestamp: b.timestamp,
        status: b.bidAmount >= topBidAmount ? 'Winning' : 'Losing'
      }))
    })
  } catch (err) {
    console.error('Error fetching lot bids:', err)
    res.status(500).json({ message: 'Failed to fetch lot bids', error: err.message })
  }
})

// Admin Orders Dashboard Endpoint
app.get('/api/admin/orders', async (req, res) => {
  try {
    const allBids = await getAllBids()

    // Group by lotId
    const lotMap = new Map()
    for (const b of allBids) {
      const lotId = String(b.lotId)
      if (!lotMap.has(lotId)) {
        lotMap.set(lotId, [])
      }
      lotMap.get(lotId).push(b)
    }

    const orders = []

    for (const [lotId, bids] of lotMap.entries()) {
      bids.sort((a, b) => b.bidAmount - a.bidAmount || new Date(a.timestamp) - new Date(b.timestamp))
      const topBid = bids[0]

      orders.push({
        lotId,
        lotName: topBid.lotName,
        lotImageUrl: topBid.lotImageUrl,
        floorPrice: topBid.floorPrice,
        mrp: topBid.mrp,
        endDate: topBid.endDate,
        totalBidsCount: bids.length,
        currentTopBid: topBid.bidAmount,
        winningUserEmail: topBid.userEmail,
        winningUserName: topBid.userName,
        bidders: bids.map(b => ({
          id: b.id,
          userEmail: b.userEmail,
          userName: b.userName,
          bidAmount: b.bidAmount,
          timestamp: b.timestamp,
          status: b.bidAmount === topBid.bidAmount ? 'Winning' : 'Losing'
        }))
      })
    }

    // Sort orders by top bid value descending
    orders.sort((a, b) => b.currentTopBid - a.currentTopBid)

    res.json({
      success: true,
      totalLots: orders.length,
      totalBids: allBids.length,
      orders
    })
  } catch (err) {
    console.error('Error fetching admin orders:', err)
    res.status(500).json({ message: 'Failed to fetch admin orders', error: err.message })
  }
})

// Build the manifest Excel buffer for a lot with WholeLot Traders price hike applied.
// Used by both the download endpoint and the email endpoint.
async function buildManifestExcel(lotId) {
  // 1. Fetch lot details from b4traders
  const lotDetailsRes = await fetch(`https://www.b4traders.com/api/lot_publishes/${lotId}/lot_details`, {
    headers: { 'Accept': 'application/json, text/plain, */*' }
  })

  if (!lotDetailsRes.ok) {
    const err = new Error('Failed to fetch lot details from source')
    err.statusCode = lotDetailsRes.status
    throw err
  }

    const lotData = await lotDetailsRes.json()
    const summary = lotData?.lot_summary || {}
    const manifestUrl = summary?.manifest_url
    const lotNumber = summary?.lot_number || lotId
    const lotName = summary?.lot_name || `Lot ${lotId}`

    // 2. Fetch current price config (global hike & range hikes)
    const { priceHike, rangeHikes } = await getPriceConfig()

    let excelBuffer = null

    if (manifestUrl) {
      try {
        const fileRes = await fetch(manifestUrl)
        if (fileRes.ok) {
          const arrayBuffer = await fileRes.arrayBuffer()
          const workbook = XLSX.read(Buffer.from(arrayBuffer), { type: 'buffer' })
          const firstSheetName = workbook.SheetNames[0] || 'Manifest'
          const sheet = workbook.Sheets[firstSheetName]
          const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 })

          if (rows && rows.length > 0) {
            const headers = rows[0]
            const floorPriceIdx = headers.findIndex((h) => {
              const str = String(h || '').trim().toLowerCase()
              return str.includes('floor price') || str === 'floor_price'
            })

            // Hike Floor Price in every row
            for (let i = 1; i < rows.length; i++) {
              const row = rows[i]
              if (!row || row.length === 0) continue
              if (floorPriceIdx !== -1 && row[floorPriceIdx] !== undefined && row[floorPriceIdx] !== '') {
                const rawVal = Number(row[floorPriceIdx])
                if (!isNaN(rawVal)) {
                  row[floorPriceIdx] = applyPriceHikeToNumber(rawVal, priceHike, rangeHikes)
                }
              }
            }

            const newSheet = XLSX.utils.aoa_to_sheet(rows)
            // Preserve original column widths so the file looks like the source manifest
            if (sheet['!cols']) newSheet['!cols'] = sheet['!cols']
            const newWb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(newWb, newSheet, firstSheetName)
            excelBuffer = XLSX.write(newWb, { type: 'buffer', bookType: 'xlsx' })
          }
        }
      } catch (fetchErr) {
        console.warn(`Could not load direct manifest url ${manifestUrl}, falling back to lot inventories:`, fetchErr)
      }
    }

    // 3. Fallback: if manifestUrl was not available or failed, build from inventories
    if (!excelBuffer) {
      let allProducts = []
      let page = 1
      let totalPages = 1

      while (page <= totalPages && page <= 50) {
        const invRes = await fetch(
          `https://www.b4traders.com/api/lot_publishes/${lotId}/fetch_lot_inventories?per_page=100&page=${page}`,
          { headers: { 'Accept': 'application/json' } }
        )
        if (!invRes.ok) break
        const invData = await invRes.json()
        const prods = invData?.all_products || []
        allProducts = allProducts.concat(prods)
        totalPages = invData?.meta?.total_pages || 1
        page++
      }

      // Standard Manifest headers matching b4traders
      const headers = [
        'Title', 'Lot Name', 'City', 'Tag Number', 'Inventory ID',
        'Category L1', 'Category L2', 'Category L3', 'Category L4', 'Category L5', 'Category L6',
        'Item Type', 'Brand', 'Model', 'Sub-Model/ Variant', 'MRP ( in INR )',
        'Quantity', 'Functional status', 'Packaging status', 'Grade',
        'Item Description', 'Remarks', 'Floor Price'
      ]

      const rows = [headers]
      for (const p of allProducts) {
        const rawMrp = Number(p.mrp || 0)
        const rawItemFloorPrice = Number(p.floor_price || 0) || (summary.mrp ? Math.round((rawMrp / summary.mrp) * summary.floor_price) : 0)
        const hikedFloorPrice = applyPriceHikeToNumber(rawItemFloorPrice, priceHike, rangeHikes)

        rows.push([
          p.description || p.title || '',
          lotName,
          summary.storage_location || '',
          p.tag_number || '',
          p.id || '',
          p.category || '',
          '', '', '', '', '',
          p.item_type || '',
          p.brand || '',
          p.model || '',
          p.variant || '',
          rawMrp,
          p.quantity || 1,
          summary.status || 'As-Is-Condition',
          'As-Is-Condition',
          summary.grade_name || 'Not Tested',
          p.description || '',
          'NA',
          hikedFloorPrice
        ])
      }

      const newSheet = XLSX.utils.aoa_to_sheet(rows)
      // Give the generated sheet readable column widths
      newSheet['!cols'] = headers.map((h, i) => ({ wch: i === 0 || i === 20 ? 50 : (i === 1 ? 45 : 14) }))
      const newWb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(newWb, newSheet, 'Manifest')
      excelBuffer = XLSX.write(newWb, { type: 'buffer', bookType: 'xlsx' })
    }

  return { excelBuffer, filename: `manifest_${lotNumber}.xlsx`, lotName }
}

// Download Manifest with WholeLot Traders Price Hike Applied
app.get(['/api/manifest/:lotId', '/api/lots/:lotId/manifest'], async (req, res) => {
  try {
    const lotId = String(req.params.lotId).trim()
    if (!lotId) {
      return res.status(400).json({ message: 'Lot ID is required' })
    }

    const { excelBuffer, filename } = await buildManifestExcel(lotId)

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Length', excelBuffer.length)
    return res.send(excelBuffer)
  } catch (err) {
    console.error('Error generating manifest file:', err)
    return res.status(err.statusCode || 500).json({ message: err.statusCode ? err.message : 'Failed to generate manifest file', error: err.message })
  }
})

// Email Manifest — sends the hiked manifest file to the requested email address
app.post('/api/manifest/:lotId/email', async (req, res) => {
  try {
    const lotId = String(req.params.lotId).trim()
    if (!lotId) {
      return res.status(400).json({ message: 'Lot ID is required' })
    }

    const email = String(req.body?.email || '').trim().toLowerCase()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'A valid email address is required' })
    }

    const smtpHost = process.env.SMTP_HOST
    const smtpPort = Number(process.env.SMTP_PORT || 587)
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS
    const mailFrom = process.env.MAIL_FROM || smtpUser

    if (!smtpHost || !smtpUser || !smtpPass) {
      return res.status(503).json({ message: 'Email service is not configured. Please contact support.' })
    }

    const { excelBuffer, filename, lotName } = await buildManifestExcel(lotId)

    const nodemailer = (await import('nodemailer')).default
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass }
    })

    await transporter.sendMail({
      from: mailFrom,
      to: email,
      subject: `Manifest - ${lotName}`,
      text: `Hi,\n\nPlease find attached the manifest for "${lotName}".\n\nAll Floor Prices already include the WholeLot Traders markup.\n\nThanks,\nWholeLot Traders`,
      attachments: [
        {
          filename,
          content: excelBuffer,
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      ]
    })

    return res.json({ success: true, message: `Manifest has been sent to ${email}` })
  } catch (err) {
    console.error('Error emailing manifest file:', err)
    return res.status(err.statusCode || 500).json({ message: err.statusCode ? err.message : 'Failed to email manifest file', error: err.message })
  }
})

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}

export default app
