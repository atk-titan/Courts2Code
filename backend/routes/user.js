const express = require('express');

const user = express.Router();

user.use("/lawyer");
user.use("/judges");
user.use("/bailiffs");
user.use("/forensic_expert");

module.exports={user};