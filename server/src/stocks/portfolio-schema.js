import mongoose from 'mongoose'

const { Schema } = mongoose

const holdingSchema = new Schema({
  stock: {
    type: Schema.Types.ObjectId,
    ref: 'Stock',
    required: true,
  },
  symbol: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
  },
  averageCost: {
    type: Number,
    required: true,
  },
}, { _id: false })

const portfolioSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  mode: {
    type: String,
    enum: ['demo', 'live'],
    default: 'demo',
    required: true,
  },
  balance: {
    type: Number,
    required: true,
    default: 100000,
  },
  holdings: [holdingSchema],
}, {
  timestamps: true,
})

portfolioSchema.index({ user: 1, mode: 1 }, { unique: true })

export default mongoose.model('Portfolio', portfolioSchema)
