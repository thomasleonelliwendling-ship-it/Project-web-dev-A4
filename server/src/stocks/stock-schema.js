import mongoose from 'mongoose'

const { Schema } = mongoose

const pricePointSchema = new Schema({
  date: { type: Date, required: true },
  open: { type: Number, required: true },
  close: { type: Number, required: true },
  high: { type: Number, required: true },
  low: { type: Number, required: true },
}, { _id: false })

const stockSchema = new Schema({
  symbol: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
  },
  name: {
    type: String,
    required: true,
  },
  sector: {
    type: String,
    required: true,
  },
  currentPrice: {
    type: Number,
    required: true,
  },
  previousClose: {
    type: Number,
    required: true,
  },
  priceHistory: [pricePointSchema],
}, {
  timestamps: true,
})

export default mongoose.model('Stock', stockSchema)
