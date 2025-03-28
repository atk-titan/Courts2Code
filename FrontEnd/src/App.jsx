import { useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import Axios from 'axios';
import axios from 'axios';

function App() {
  const [amount, setAmount] = useState(0);

  async function payNow(caseId) {
    try {
      const response = await Axios.get(`http://localhost:3000/user/lawyer/transfer/money/orderID?amount=${amount}&caseId=${caseId}`,{
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3YmM2OTk3MzM3MTVhNDkxMTcyMWM5OSIsInJvbGUiOiJsYXd5ZXIiLCJpYXQiOjE3NDE2NzI4ODYsImV4cCI6MTc0MTcxNjA4Nn0.O2nG1BP8u4w1GNPfOhK5kUbDd7-SZSqi1YXE22fZ_jc' 
          },
      });
      const order = response.data;
      console.log("order"+order)

      const options = {
        key: 'rzp_test_uV3C0lEnqJv9ak', // Replace with your Razorpay key_id
        amount: parseInt(amount) * 100, // Convert INR to paise
        currency: 'INR',
        name: 'Acme Corp',
        description: 'Test Transaction',
        order_id: order.order_id, // Ensure order_id exists
        callback_url: 'http://localhost:3000/payment-success',
        prefill: {
          name: 'DAALA MUKESH',
          email: 'MUKUU@example.com',
          contact: '9999999999'
        },
        theme: { color: '#F37254' },
      };

      const rzp = new Razorpay(options);
      rzp.open();

      rzp.on('payment.success',async function(paymentDetails) {
        console.log(paymentDetails);
        const res = await Axios.post("http://localhost:3000/user/lawyer/transfer/money/addTransaction",{
          body:{
            "amount":amount,
            "caseId":caseId,
          }
        });
        
      });
     
      rzp.on('payment.failure', function(error) {
        console.log(error);
      });     
    } catch (error) {
      console.error('Error processing payment:', error);
    }
  }

  return (
    <>
      <input type="text" onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" />
      <button onClick={()=>payNow("67bc80946c6bfa02cb8913bc")}>Pay Now</button>
    </>
  );
}

export default App;