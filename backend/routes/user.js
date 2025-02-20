const express = require('express');
const { lawyer } = require('./lawyer');
const { judge } = require('./judges');
const { for_expert } = require('./forensicExpert');
const { bailiff } = require('./bailiffs');

const user = express.Router();

user.use("/lawyer",lawyer);
user.use("/judges",judge);
user.use("/bailiffs",bailiff);
user.use("/forensic_expert",for_expert);

module.exports={user};