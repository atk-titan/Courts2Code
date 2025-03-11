const express = require('express');
const jwt = require('jsonwebtoken');
const Razorpay = require('razorpay');
const { Case, Lawyer, User } = require('../mongo');
const { judicialDepositContract } = require('../contract');
const { verifyJWT } = require('../middlewares/authCheck');

const money = express.Router();

// Initialize Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create a Razorpay Order and Store Transaction on Blockchain
money.get('/orderID', verifyJWT, async (req, res) => {
    try {
        const authToken = req.headers.authorization;
        const decoded = jwt.decode(authToken);
        const role = decoded.role;
        const id = decoded.id;

        if (role !== "lawyer") {
            return res.status(401).json({ msg: "You are not authorized to do this operation" });
        }

        const caseId =req.query.caseId;
        const amount = req.query.amount;

        const lawyerDets = await Lawyer.findOne({ userId: id });
        console.log(lawyerDets);
        const user = await User.findOne({_id:id});
        console.log(user)

        if (!lawyerDets) return res.status(404).json({ msg: "Lawyer not found" });

        if (!lawyerDets.ongoingCases.includes(caseId.toString())) {
            return res.status(403).json({ msg: `You are not associated with the case ${caseId}` });
        }

        const caseDetails = await Case.findOne({ _id: caseId });
        if (!caseDetails) return res.status(404).json({ msg: "Case not found" });

        if (caseDetails.status !== 'Open') {
            return res.status(400).json({ msg: "The case is not open" });
        }

        const options = {
            amount: amount * 100, // Convert to paisa
            currency: "INR",
            receipt: `receipt_${caseId}`
        };

        const order = await razorpay.orders.create(options);

        res.status(200).json({
            msg: "Order created, successfully",
            order,
            order_id: order.id
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            msg: "Something went wrong while creating order",
            err
        });
    }
});

module.exports = { money };
       
       
       
       
       
       
       
       
       
        // console.log(order);
        // // Blockchain transaction details
        // const txParameters = [
        //     caseId,                                       // _caseID
        //     caseDetails.judge,                            // _judgeId
        //     caseDetails.courtName,                        // _courtName
        //     caseDetails.parties[0] || "",                 // _party1
        //     caseDetails.parties[1] || "",                 // _party2
        //     user.email || user.name,         // _from (lawyer identifier)
        //     caseDetails.judge,                            // _to (assuming money goes to the court)
        //     amount,                                       // _amount (actual amount from Razorpay)
        //     "",                                           // _contentId (empty for money transactions)
        //     true,                                         // _transactionType: true for money transfer
        //     Math.floor(Date.now() / 1000)                 // _date (current timestamp)
        // ];
        // console.log(txParameters);

        // // Send transaction to blockchain
        // const senderAddress = process.env.AUTHORIZED_ACCOUNT;
        // const gasEstimate = await judicialDepositContract.methods
        //     .addTransaction(...txParameters)
        //     .estimateGas({ from: senderAddress });

        // const tx = await judicialDepositContract.methods.addTransaction(...txParameters).send({
        //     from: senderAddress,
        //     gas: gasEstimate + 10000, // Add buffer
        // });




















































































