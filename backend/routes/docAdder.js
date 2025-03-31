import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
import path from 'path';
import PinataSDK from '@pinata/sdk';
import { verifyJWT } from "../middlewares/authCheck.js";
import { Case, User } from "../mongo.js";
import { judicialDepositContract } from "../contract.js";

const docAdder = express.Router();

// Fixed middleware order and error handling
docAdder.post('/', verifyJWT, async (req, res) => {
  try {
    // Get user from JWT middleware
    const { role, id } = req.user;
    const ipfsHash = req.body.cid;

    // Authorization check
    if (!['lawyer', 'forensic_expert'].includes(role)) {
      return res.status(403).json({ 
        success: false,
        msg: "Unauthorized role" 
      });
    }

    // Validate input
    const { caseId } = req.body;
    if (!caseId || !req.file) {
      return res.status(400).json({
        success: false,
        msg: "Missing required fields: caseId or file"
      });
    }

    // Parallel database queries
    const [user, caseDetails] = await Promise.all([
      User.findById(id),
      Case.findById(caseId)
    ]);

    if (!user || user.status !== "Verified") {
      return res.status(403).json({
        success: false,
        msg: "User not verified or not found"
      });
    }

    if (!caseDetails) {
      return res.status(404).json({
        success: false,
        msg: "Case not found"
      });
    }

    // Prepare contract parameters
    const txParams = [
      caseId.toString(),                  // string memory _caseID
      caseDetails.judge || "",            // string memory _judgeId
      caseDetails.courtName || "",        // string memory _courtName
      caseDetails.parties[0] || "",       // string memory _party1
      caseDetails.parties[1] || "",       // string memory _party2
      user.email || user.name,            // string memory _from
      "",                                 // string memory _to
      0,                                  // uint256 _amount
      ipfsHash,                           // string memory _contentId
      false,                              // bool _transactionType
      Math.floor(Date.now() / 1000)       // uint256 _date
    ];

    // Send transaction with gas buffer
    const senderAddress = process.env.AUTHORIZED_ACCOUNT;
    const gasEstimate = await judicialDepositContract.methods
      .addTransaction(...txParams)
      .estimateGas({ from: senderAddress });

    const tx = await judicialDepositContract.methods
      .addTransaction(...txParams)
      .send({
        from: senderAddress,
        gas: Math.floor(gasEstimate * 1.2) // 20% buffer
      });

    res.json({
      success: true,
      message: "Document added successfully",
      ipfsHash,
      txHash: tx.transactionHash
    });

  } catch (error) {
    console.error("Error in document addition:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Updated document retrieval endpoint
docAdder.get('/', verifyJWT, async (req, res) => {
  try {
    // Authorization check
    if (req.user.role !== "judge" && req.user.role !== "bailiff") {
      return res.status(403).json({
        success: false,
        msg: "Judge/bailiff access required"
      });
    }

    // Validate input
    const { caseId } = req.query;
    if (!caseId) {
      return res.status(400).json({
        success: false,
        msg: "caseId query parameter is required"
      });
    }

    // Get content IDs from blockchain
    const contentIds = await judicialDepositContract.methods
      .getContentIdsByCase(caseId)
      .call();


    res.json({
      success: true,
      caseId,
      count: contentIds.length,
      cids: contentIds
    });

  } catch (error) {
    console.error("Error in document retrieval:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

export { docAdder };