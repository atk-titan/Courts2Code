const express = require('express');
const { verifyJWT } = require('../middlewares/authCheck');
const { Case, Lawyer, User } = require('../mongo');
const { judicialDepositContract } = require("../contract");
const jwt = require('jsonwebtoken');

const bailiff = express.Router();

// const data = [
//   {
//     caseNumber: "2025-CIV-001",
//     title: "Smith vs. Johnson",
//     description: "A civil dispute over property ownership.",
//     parties: ["John Smith", "Michael Johnson"],
//     judge: "Judge Emily Carter",
//     courtName: "New York Civil Court",
//     _id: "cd123456", // Add _id if your frontend expects it
//     status: "Pending"
//   },
//   {
//     caseNumber: "2025-CIV-001",
//     title: "Smith vs. Johnson",
//     description: "A civil dispute over property ownership.",
//     parties: ["John Smith", "Michael Johnson"],
//     judge: "Judge Emily Carter",
//     courtName: "New York Civil Court",
//     _id: "cd1456", // Add _id if your frontend expects it
//     status: "Pending"
//   },
//   {
//     caseNumber: "2025-CIV-001",
//     title: "Smith vs. Johnson",
//     description: "A civil dispute over property ownership.",
//     parties: ["John Smith", "Michael Johnson"],
//     judge: "Judge Emily Carter",
//     courtName: "New York Civil Court",
//     _id: "cd1896", // Add _id if your frontend expects it
//     status: "Pending"
//   }
// ];


// GET pending cases
bailiff.get("/case", verifyJWT, async (req, res) => {
  try {
    
    const pendingCases = await Case.find({ status: "Pending" });
    // console.log(pendingCases);
    return res.status(200).json({ pendingCases });
    // dummy data for the testing
    // return res.status(200).json({ pendingCases: data }); 
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error" });
  }
});

bailiff.get("/trans", verifyJWT, async (req, res) => {
    try {
      // Expect caseId as a query parameter
      const { caseId } = req.query;
      const caseDoc = await Case.findById(caseId);
      if (!caseId) {
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

//close case dropdown
bailiff.get("/openCaseDetails", verifyJWT, async (req, res) => {
  try {
    
    const pendingCases = await Case.find({ status: "Open" });
    // console.log(pendingCases);
    return res.status(200).json({ pendingCases });
    // dummy data for the testing
    // return res.status(200).json({ pendingCases: data }); 
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error" });
  }
});

bailiff.get("/barCertificate",verifyJWT,async (req,res)=>{
  try{
    const {id, role} = req.user;

    if(!id){
      console.log("no id from authorization header. check verifyJWT");
      res.status(500).json({msg:"no id from authorization header. Check verifyJWT"});
    }

    const lawyer = await Lawyer.findOne({userId:id});

    if(!lawyer){
      res.status(404).json({msg:"lawyer not found, maybe the id is wrong"});
      console.log("lawyer not found, maybe the id is wrong");
    }

    res.status(200).json({barCid:lawyer.barCertificate , identityProof: lawyer.identityProof});
    
  }catch(err){
    console.log(err);
    res.status(500).json({msg:err});
  }
});

//get all unverified lawyer for verifying them.
// {
//   "pendingLawyers": [
//     {
//       "_id": "123abc",
//       "name": "Adv. Rakesh",
//       "email": "rakesh@example.com",
//       "phone": "9876543210",
//       "status": "Pending",
//       "barCertificateCID": "bafkreigx...",
//       "identityProofCID": "bafkreiop..."
//     },
//     ...
//   ]
// }
bailiff.get("/lawyers", verifyJWT, async (req, res) => {
  try {
    const { id, role } = req.user;

    if (!id) {
      return res.status(404).json({ msg: "ID not received" });
    }

    const users = await User.find({ role: "lawyer", status: "Pending" });

    if (!users || users.length === 0) {
      return res.status(200).json({ msg: "No pending lawyers found" });
    }

    const userIds = users.map((user) => user._id);
    const lawyers = await Lawyer.find({ userId: { $in: userIds } });

    // Create a map for quick lookup
    const lawyerMap = new Map();
    lawyers.forEach((lawyer) => {
      lawyerMap.set(lawyer.userId.toString(), {
        barCertificateCID: lawyer.barCertificate,
        identityProofCID: lawyer.identityProof,
      });
    });

    // Merge user and lawyer info
    const mergedData = users.map((user) => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      status: user.status,
      ...lawyerMap.get(user._id.toString()) // merge CID details
    }));

    res.status(200).json({ pendingLawyers: mergedData });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server Error", error: err });
  }
});

module.exports = { bailiff }; 