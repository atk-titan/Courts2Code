const express = require('express');
require("dotenv").config();
const jwt = require('jsonwebtoken');
const multer = require('multer');
const Web3 = require('web3');
import { PinataSDK } from "pinata-web3";
import { verifyJWT } from "../middlewares/authCheck";
const { Case, User } = require("../mongo");

// Configure Multer to store files on disk in the 'uploads' directory
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Make sure this folder exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});
const upload = multer({ storage: storage });

const docAdder = express.Router();

// Set up Web3 and the JudicialDeposit contract instance
const web3 = new Web3(process.env.WEB3_PROVIDER);
const contractABI = require('../build/ABI.json'); // Adjust path to your ABI file
const contractAddress = process.env.JUDICIAL_DEPOSIT_CONTRACT_ADDRESS;
const judicialDepositContract = new web3.eth.Contract(contractABI, contractAddress);

// Set up Pinata SDK
const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: process.env.PINATA_GATEWAY,
});

// Function to push a file to IPFS via Pinata using its file path
async function ipfsPushFile(filePath) {
  try {
    const uploadResult = await pinata.upload.file(filePath);
    console.log("IPFS Upload result:", uploadResult);
    return uploadResult;
  } catch (error) {
    console.error("Error uploading file to IPFS:", error);
    throw error;
  }
}

/**
 * POST /docAdder
 *  - Accepts a file via Multer (field name: 'file') and a caseId (in req.body).
 *  - Only verified users with role 'lawyer' or 'forensic_expert' can call this endpoint.
 *  - The file is uploaded to IPFS via Pinata.
 *  - The IPFS hash is recorded on-chain via the JudicialDeposit contract.
 *  - Other transaction parameters are fetched from MongoDB:
 *      - The case details are retrieved using caseId.
 *      - The lawyer’s details are taken from the verified user's document.
 */
docAdder.post('/', upload.single('file'), verifyJWT, async (req, res) => {
  try {
    const authToken = req.headers.authorization;
    const decoded = jwt.decode(authToken);
    const role = decoded.role;
    const id = decoded.id;

    // Verify user status from MongoDB
    const person = await User.findOne({ _id: id });
    if (!person || person.status !== "Verified") {
      return res.status(403).json({ msg: "User not verified" });
    }

    // Accept only caseId from the request body
    const { caseId } = req.body;
    if (!caseId) {
      return res.status(400).json({ msg: "caseId is required" });
    }

    // Retrieve case details from MongoDB
    const caseDetails = await Case.findOne({ _id: caseId });
    if (!caseDetails) {
      return res.status(404).json({ msg: "Case not found" });
    }

    // Only allow roles 'lawyer' or 'forensic_expert'
    if (role !== 'lawyer' && role !== 'forensic_expert') {
      return res.status(403).json({ msg: "Unauthorized role" });
    }

    // Ensure a file was uploaded
    if (!req.file) {
      return res.status(400).json({ msg: "No file uploaded" });
    }

    // Upload the file to IPFS via Pinata using the file path (from diskStorage)
    const uploadResult = await ipfsPushFile(req.file.path);
    const fileHash = uploadResult.IpfsHash; // Assuming the result includes IpfsHash

    // Prepare parameters for the smart contract call.
    // For content addition (transactionType = false), we set amount to 0.
    // We fetch judge and courtName from caseDetails, and assume parties are stored in caseDetails.parties array.
    // For the 'from' field, we use the lawyer's identifier (e.g., email or name from the person document).
    // The 'to' field is left as an empty string (or you can adjust if needed).
    const txParameters = [
      caseId,                                       // _caseID
      caseDetails.judge,                            // _judgeId (from caseDetails)
      caseDetails.courtName,                        // _courtName
      caseDetails.parties[0] || "",                 // _party1 (first party in the array)
      caseDetails.parties[1] || "",                 // _party2 (second party, if exists)
      person.email || person.name,                  // _from (lawyer's identifier)
      "",                                           // _to (empty string; adjust if needed)
      0,                                            // _amount = 0 (content adding)
      fileHash,                                     // _contentId (IPFS hash)
      false,                                        // _transactionType: false for content adding
      Math.floor(Date.now() / 1000)                 // _date: current timestamp in seconds (can be adjusted)
    ];

    // Send the transaction to record the IPFS hash on-chain.
    // The authorized account (from env) must be allowed to call the contract.
    const senderAddress = process.env.AUTHORIZED_ACCOUNT;
    const gasEstimate = await judicialDepositContract.methods.addTransaction(...txParameters).estimateGas({ from: senderAddress });
    const tx = await judicialDepositContract.methods.addTransaction(...txParameters).send({
      from: senderAddress,
      gas: gasEstimate + 10000, // add some buffer
    });

    return res.status(200).json({
      msg: "File uploaded to IPFS and transaction recorded on ledger successfully",
      ipfsData: uploadResult,
      txData: tx,
    });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ msg: "Server error", error: err.toString() });
  }
});

docAdder.get('/',verifyJWT,async (req,res)=>{

});

module.exports = { docAdder };