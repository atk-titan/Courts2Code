const express = require('express');
const { User, Lawyer, Case } = require('../mongo');
const { transfer } = require('./transfer');
const { verifyJWT } = require('../middlewares/authCheck');
const jwt = require('jsonwebtoken');
const Web3 = require('web3');

// Set up Web3 with your provider (e.g., Infura URL or local node)
const web3 = new Web3(process.env.WEB3_PROVIDER);

// Load the JudicialDeposit contract ABI and address
const contractABI = require('../build/ABI.json'); // Adjust path to your contract's ABI
const contractAddress = process.env.JUDICIAL_DEPOSIT_CONTRACT_ADDRESS;
const judicialDepositContract = new web3.eth.Contract(contractABI, contractAddress);

const lawyer = express.Router();
lawyer.use(express.json());

lawyer.use("/transfer",transfer);

/**
 * GET /lawyer?caseId=<caseId>
 * Returns all money transactions for a given case from the JudicialDeposit contract.
 */
lawyer.get('/', verifyJWT, async (req, res) => {
  try {
    const authToken = req.headers.authorization;
    const decoded = jwt.decode(authToken);
    const id = decoded.id;

    // Retrieve user and lawyer documents from MongoDB
    const user = await User.findOne({ _id: id });
    const lawyerDoc = await Lawyer.findOne({ userId: id });
    // console.log(user);
    // console.log(lawyerDoc);

    if (!user || user.status == true) {
      return res.status(403).json({ msg: "User not verified" });
    }

    // Get the caseId from query parameters
    const caseId = req.query.caseId;
    if (!caseId) {
      return res.status(400).json({ msg: "caseId is required" });
    }

    // Check if the lawyer is associated with this case
    if (!lawyerDoc.ongoingCases.includes(caseId)) {
      return res.status(403).json({ msg: "You are not associated with this case" });
    }

    // Call the JudicialDeposit contract to get money transactions for the given case
    const moneyTransactions = await judicialDepositContract.methods.getMoneyTransactions(caseId).call();

    // console.log( moneyTransactions);
    return res.status(200).json({ moneyTransactions });


  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error" });
  }
});

/**
 * POST /lawyer
 * Allows a verified lawyer to file a new case.
 * Expected request body fields:
 *   - caseNumber (string)
 *   - title (string)
 *   - description (string, optional)
 *   - parties (array of strings)
 *   - judge (string)
 *   - courtName (string)
 */
lawyer.post('/', verifyJWT, async (req, res) => {

  try {
    const authToken = req.headers.authorization;
    // console.log(authToken);
    const decoded = jwt.decode(authToken);
    const id = decoded.id;
    console.log(id)

    // Retrieve user and lawyer documents from MongoDB
    const user = await User.findOne({ _id: id });
    const lawyerDoc = await Lawyer.findOne({ userId: id });
    // console.log(user)
    // console.log(user)
    // console.log("hello")

    if (!user || user.status == true) {
      return res.status(403).json({ msg: "User not verified" });
    }

    // Extract new case details from request body
    const { title, description, parties, judge, courtName } = req.body;
    if (!title || !parties || !judge || !courtName) {
      return res.status(400).json({ msg: "Missing required fields" });
    }

    // Create a new Case document with status "Open"
    const newCase = await Case.create({
      title,
      description,
      parties,
      lawyerId: [lawyerDoc._id], // assuming the lawyer represents one party; adjust as needed
      judge,
      courtName,
    });

    // Add the new case to the lawyer's ongoingCases array and save
    lawyerDoc.ongoingCases.push(newCase._id);
    await lawyerDoc.save();
    console.log(newCase._id)

    return res.status(201).json({ msg: "Case filed successfully", case: newCase });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error" });
  }
});

// this is the expected output of the route
// {
//   "ongoingCases": [
//     {
//       "_id": "123abc",
//       "title": "Land Dispute",
//       "parties": ["A", "B"],
//       "judge": "Judge Judy",
//       "courtName": "Mumbai High Court"
//     },
//     ...
//   ]
// }
lawyer.get('/cases', verifyJWT , async (req,res)=>{
  try{
    const authToken = req.headers.authorization;
    const decoded = jwt.decode(authToken);
    const id = decoded.id;

    const lawyer = await Lawyer.findOne({userId:id});

    if(!lawyer){
      res.status(404).json({msg:"lawyer not found"});
      console.log("lawyer not found");
    }

    // Populate case details if you want to return full data instead of just IDs
    const ongoingCases = await Case.find({ _id: { $in: lawyer.ongoingCases } });

    res.status(200).json({ongoingCases});

  }catch(err){
    console.log(err);
    res.status(500).json({msg:err});
  }
});

module.exports = { lawyer };