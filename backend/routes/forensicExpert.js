import express from 'express';
import { docAdder } from './docAdder.js';// Correct import

const for_expert = express.Router();

for_expert.use('/docAdder', docAdder);

export { for_expert };