const express = require('express');
const { lawyer } = require('./lawyer');
const { judge } = require('./judges');
const { for_expert } = require('./forensicExpert');

const user = express.Router();

user.use("/lawyer",lawyer);
user.use("/judges",judge);
user.use("/bailiffs");
user.use("/forensic_expert",for_expert);

module.exports={user};