import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5001
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cesta'

app.use(cors())
app.use(express.json())

// Seed trader accounts
const TRADER_ACCOUNTS = [
  { id: '1', email: 'trader1@gmail.com', password: 'password', name: 'Trader One' },
  { id: '2', email: 'trader2@gmail.com', password: 'password', name: 'Trader Two' },
  { id: '3', email: 'trader3@gmail.com', password: 'password', name: 'Trader Three' }
]

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

mongoose.set('strictQuery', false)
if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
    .then(() => {
      console.log('MongoDB connected successfully')
      isMongoConnected = true
      BidModel = mongoose.model('Bid', bidSchema)
    })
    .catch((err) => {
      console.warn('MongoDB connection notice (using in-memory bid store):', err.message)
    })
}

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

// Authentication Route
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' })
  }

  const cleanEmail = email.toLowerCase().trim()
  const account = TRADER_ACCOUNTS.find(
    acc => acc.email.toLowerCase() === cleanEmail && acc.password === password
  )

  if (account) {
    return res.json({
      success: true,
      user: {
        id: account.id,
        email: account.email,
        name: account.name
      }
    })
  }

  // Allow dynamic logins for trader emails if password is 'password'
  if (cleanEmail.startsWith('trader') && password === 'password') {
    const formattedName = cleanEmail.split('@')[0]
    return res.json({
      success: true,
      user: {
        id: String(Date.now()),
        email: cleanEmail,
        name: formattedName.charAt(0).toUpperCase() + formattedName.slice(1)
      }
    })
  }

  return res.status(401).json({ message: 'Invalid credentials. Use trader1@gmail.com, trader2@gmail.com or trader3@gmail.com with password "password"' })
})

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

    const newBid = await saveBid({
      lotId,
      lotName,
      lotImageUrl,
      bidAmount: numBid,
      floorPrice,
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

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}

export default app
