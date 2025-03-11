const express = require('express');
const { verifyJWT } = require('../middlewares/authCheck');
const { Case, Lawyer, User } = require('../mongo');
const { judicialDepositContract } = require("../contract");
const jwt = require('jsonwebtoken');

const bailiff = express.Router();

// GET pending cases
bailiff.get("/case", verifyJWT, async (req, res) => {
  try {
    const pendingCases = await Case.find({ status: "Pending" });
    return res.status(200).json({ pendingCases });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error" });
  }
});

bailiff.get("/trans", verifyJWT, async (req, res) => {
    try {
      // Expect caseId as a query parameter
      console.log(req.query)
      const { caseId } = req.query;
      const caseDoc = await Case.findById(caseId);
      if (!caseDoc) {
        return res.status(400).json({ msg: "caseId is required" });
      }
  
      const token = req.headers.authorization;
      // Decode JWT to ensure the caller is a bailiff
      const decoded = jwt.decode(token);
      if (decoded.role !== "bailiff") {
        return res.status(403).json({ msg: "Access restricted to bailiffs" });
      }
  
      // Call the smart contract to fetch all transactions for the given caseId.
      const transactions = await judicialDepositContract.methods.getTransactions(caseId).call();
  
      return res.status(200).json({ transactions });
    } catch (err) {
      console.error("Server error:", err);
      return res.status(500).json({ msg: "Server error", error: err.toString() });
    }
}); 

// Change lawyer for a case
bailiff.put("/changeLawyer", verifyJWT, async (req, res) => {
  try {
    const { oldUserId, newUserId, caseId } = req.body;

    const oldLawyer = await Lawyer.findOne({ userId: oldUserId });
    if (!oldLawyer) {
      return res.status(400).json({ msg: "The entered userid of old lawyer is wrong" });
    }
    if (!oldLawyer.ongoingCases.includes(caseId)) {
      return res.status(400).json({ msg: "The lawyer you provided is not associated with the case" });
    }

    const newLawyer = await Lawyer.findOne({ userId: newUserId });
    if (!newLawyer) {
      return res.status(400).json({ msg: "The entered userid of new lawyer is wrong" });
    }

    const caseDetails = await Case.findOne({ _id: caseId });
    if (!caseDetails) {
      return res.status(404).json({ msg: "Case not found" });
    }

    // Update lawyer associations
    // Remove caseId from oldLawyer's ongoingCases
    oldLawyer.ongoingCases = oldLawyer.ongoingCases.filter(id => id.toString() !== caseId);
    // Add caseId to newLawyer's ongoingCases
    newLawyer.ongoingCases.push(caseId);

    // Update caseDetails.lawyerId array
    // Assuming lawyerId is an array of ObjectIds.
    caseDetails.lawyerId = caseDetails.lawyerId.map(lawyerId => 
      (lawyerId.toString() === oldLawyer._id.toString()) ? newLawyer._id : lawyerId
    );

    await oldLawyer.save();
    await newLawyer.save();
    await caseDetails.save();

    return res.status(200).json({ msg: "Lawyer changed successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error" });
  }
});

// Update user role/status
bailiff.put("/role", verifyJWT, async (req, res) => {
  try {
    const { userId, status } = req.body;
    const user = await User.findOne({ _id: userId });

    if (!user) {
      return res.status(404).json({ msg: "No user found / invalid userid" });
    }
    if (user.status === "Verified") {
      return res.status(400).json({ msg: "User already verified" });
    }

    await User.findOneAndUpdate({ _id: userId }, { status: status });
    return res.status(200).json({ msg: "User status updated to " + status });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error" });
  }
});

// Verify a case (set status to Open)
bailiff.put("/verifyCase", verifyJWT, async (req, res) => {
  try {
    const { caseId } = req.body;
    const caseDetails = await Case.findOne({ _id: caseId });
    if (!caseDetails) {
      return res.status(404).json({ msg: "Incorrect caseId / Case not found" });
    }

    await Case.updateOne({ _id: caseId }, { status: "Open" });
    return res.status(200).json({ msg: "Case opened (registered in court)" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error" });
  }
});

// Close a case (set status to Closed)
bailiff.put("/closeCase", verifyJWT, async (req, res) => {
  try {
    const { caseId } = req.body;
    const caseDetails = await Case.findOne({ _id: caseId });
    if (!caseDetails) {
      return res.status(404).json({ msg: "Incorrect caseId / Case not found" });
    }

    await Case.updateOne({ _id: caseId }, { status: "Closed" });
    return res.status(200).json({ msg: "Case closed" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error" });
  }
});

module.exports = { bailiff }; 