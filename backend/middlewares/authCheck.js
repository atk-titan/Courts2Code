const { User, Police, Bailiff, Judge, Lawyer, ForensicExpert} = require("../mongo.js");

const roles = {
    police: Police,
    bailiff: Bailiff,
    judge: Judge,
    lawyer: Lawyer,
    forensic_expert: ForensicExpert
  };

const createUser = async (data)=>{
    try {        
        const user = await User.create(data.user);
        data.roleDetails.userId=user._id;
        console.log(user);

        await roles[data.user.role].create(data.roleDetails);

        console.log("User and role details created successfully.");
        
        return { success: true, msg: "New User created successfully" };

    } catch (error) {
        console.log("error while creating a new user"+error);

        return { success: false, msg: error.message };
    }
};

const userSignin = async (data) =>{
    try {
        const user = await User.findOne({
            email:data.email
        });
        if(user.password===data.password){
            const token = jwt.sign(
                { id: user._id, role: user.role },
                process.env.JWT_SECRET, // Use a secure secret key from environment variables
                { expiresIn: "1h" } // Token expiration time
            );
          
            return { success: true, msg: "User verified successfully", jwtToken: token };
            
        }else{
            return { success: false, msg: "incorrect password" };
        }

    } catch (error) {
        console.error("error while finding the user"+error);

        return { success: false, msg: error.message };
    }
}

module.exports={
    createUser,
    userSignin
};