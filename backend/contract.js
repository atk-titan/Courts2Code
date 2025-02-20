const Web3 = require('web3');
require('dotenv').config();
const contractABI = require('../build/ABI.json'); // adjust the path if needed

const web3 = new Web3(process.env.WEB3_PROVIDER);
const contractAddress = process.env.JUDICIAL_DEPOSIT_CONTRACT_ADDRESS;

const judicialDepositContract = new web3.eth.Contract(contractABI, contractAddress);

module.exports = {judicialDepositContract};