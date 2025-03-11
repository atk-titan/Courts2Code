import { useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import Axios from 'axios';

function App() {
  const [amount, setAmount] = useState(0);

  async function payNow() {
    try {
      const response = await Axios.get(`http://localhost:3000/user/lawyer/transfer/money/orderID?amount=${amount}&currency=INR`,{
          headers: { 'Content-Type': 'application/json', 'Authorization': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3YmM2OTk3MzM3MTVhNDkxMTcyMWM5OSIsInJvbGUiOiJsYXd5ZXIiLCJpYXQiOjE3NDE1OTU2ODQsImV4cCI6MTc0MTYzODg4NH0.7pMgRnvvt3UE_CL0azX-x8snixCzFZFoM9o2lurpJ0E' },
          body:{
            caseId:"",
            amount:amount
          }
      });
      const order = await response.json();

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
    } catch (error) {
      console.error('Error processing payment:', error);
    }
  }

  return (
    <>
      <input type="text" onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" />
      <button onClick={payNow}>Pay Now</button>
    </>
  );
}

export default App;