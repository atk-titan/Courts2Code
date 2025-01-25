const express = require( 'express' );
const PORT=3000;
const app = express();

app.post("/register",(req,res)=>{

});

app.post("/login",(req,res)=>{

});

app.put("/forget",(req,res)=>{

});

app.get("/admin",(req,res)=>{

});

app.listen(PORT,()=>{
    console.log(`Server is running at http://localhost:${port}`);
});