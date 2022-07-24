import { Schema, model } from 'mongoose';

const pairSchema = new Schema({
    address: String,
    index: Number,
    name: String,
    symbol: String,
    token0: String,
    token1: String,
    decimals: Number,
});

const Pair = model('Pair', pairSchema, "pairs");

pairSchema.index({ token0: 1 });

pairSchema.index({ token1: 1 });

export default Pair;