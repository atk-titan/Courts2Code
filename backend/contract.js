import Web3 from 'web3';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const contractABI = JSON.parse(fs.readFileSync('./build/ABI.json', 'utf8'));
const web3 = new Web3(process.env.WEB3_PROVIDER);
const contractAddress = process.env.JUDICIAL_DEPOSIT_CONTRACT_ADDRESS;

const judicialDepositContract = new web3.eth.Contract(contractABI, contractAddress);

export { judicialDepositContract };