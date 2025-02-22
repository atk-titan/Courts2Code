import Web3 from 'web3';
require('dotenv').config();
import contractABI from './build/ABI.json'; // adjust path if needed

const web3 = new Web3(process.env.WEB3_PROVIDER);
const contractAddress = process.env.JUDICIAL_DEPOSIT_CONTRACT_ADDRESS;

const judicialDepositContract = new web3.eth.Contract(contractABI, contractAddress);

export default { judicialDepositContract };
