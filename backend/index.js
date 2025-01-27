const express = require( 'express' );
const {SignupValidation , SigninValidation} = require('./middlewares/inputValidation'); // Adjust path as needed
const { createUser , userSignin , verifyJWT } = require('./middlewares/authCheck');

const PORT=3000;

const app = express();

app.use(express.json());

const validateInput= async (req,res,next)=>{
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
        try{
            const user = await createUser(signupInput);
            if(user.success){
                next();
            }
            console.log(user.msg);
        }catch(err){
            console.log(""+err);
        }
    }else{
        res.status(403).json(valid.msg);
    }

}

app.post("/register",validateInput,(req,res)=>{
    res.status(200).send("user created");
});

app.post("/login",async (req,res)=>{
    try {
        const user=req.body; //email and password
        if(SigninValidation(user).success){
            console.log("user input validated");
            const obj = await userSignin(user);
            if(obj.success){
                res.status(200).json(obj);
            }else{
                res.status(403).json(obj);
            }
        }
        
    } catch (error) {
        res.status(403).json("some error while signing in");
    }
});

app.put("/forget",(req,res)=>{

});

app.get("/admin",(req,res)=>{
    //for accessing the entire dataset
});

app.put("/admin",(req,res)=>{

});

app.listen(PORT,()=>{
    console.log(`Server is running at http://localhost:${PORT}`);
});