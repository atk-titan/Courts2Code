const express = require('express');

const for_expert = express.Router();

//post documents by using post endpoint 
for_expert.use('/docAdder',docAdder);

module.exports = { for_expert };