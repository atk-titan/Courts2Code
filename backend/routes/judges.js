const express = require('express');
const { docAdder } = require('./docAdder')

const judge = express.Router();

//get request along with caseId and jwt_token
judge.use('/docAdder',docAdder);

module.exports = { judge };