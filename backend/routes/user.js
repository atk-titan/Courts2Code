const express = require('express');
const { lawyer } = require('./lawyer');

const user = express.Router();

user.use("/lawyer",lawyer);
user.use("/judges");
user.use("/bailiffs");
user.use("/forensic_expert");

module.exports={user};