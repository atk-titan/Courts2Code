const express = require( 'express' );
const SignupValidation = require('./middlewares/inputValidation'); // Adjust path as needed

const PORT=3000;

const app = express();

app.use(express.json());

const validateInput=(req,res,next)=>{

    // roleDetails: {
    //     barCertificate: "/uploads/bar_certificate.pdf",
    //     specialization: "Criminal Law",
    //     validTill: "2025-12-31",
    //     identityProof: "/uploads/identity_proof.pdf",
    // }
    const signupInput = {
        user: {
          name: req.body.user.name,
          email: req.body.user.email,
          password: req.body.user.password,
          role: req.body.user.role.toLowerCase(), // Determines which schema to validate
          status: "Pending",
        },
        roleDetails: req.body.roleDetails,
    };
    const valid = SignupValidation(signupInput);
    if(valid.success){
        next();
    }
    res.status(403).json(valid.msg)
}

app.post("/register",validateInput,(req,res)=>{
    res.status(200).send("input is validated");
});

app.post("/login",(req,res)=>{

});

app.put("/forget",(req,res)=>{

});

app.get("/admin",(req,res)=>{

});

app.listen(PORT,()=>{
    console.log(`Server is running at http://localhost:${PORT}`);
});