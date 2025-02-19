const express = require('express');
const { money } = require('./moneyTransfer');
const { docAdder } = require('./docAdder');

const transfer = express.Router();

transfer.use("/money",money);
transfer.use("/docAdder",docAdder);

module.exports={transfer};