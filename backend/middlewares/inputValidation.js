const { z } = require("zod");

// Common user schema
const registerUser = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(150, "Name should not exceed 150 characters"),

  email: z.string().email("Invalid email address"),

  password: z.string().min(8, "Password must be at least 8 characters long"),

  role: z
    .string()
    .refine((val) => ["police", "bailiff", "judge", "lawyer", "forensic_expert"].includes(val), {
      message: "Role must be one of the following: police, bailiff, judge, lawyer, forensic_expert",
    }),

  status: z
    .string()
    .refine((val) => ["Pending", "Verified", "Rejected"].includes(val), {
      message: "Status must be one of the following: Pending, Verified, Rejected",
    })
    .default("Pending"),
});

// Role-specific schemas
const policeSchemaValidation = z.object({
  badgeNumber: z.string().min(1, "Badge Number is required"),
  department: z.string().min(1, "Department is required"),
  stationAddress: z.string().min(1, "Station Address is required"),
  identityProof: z.string().min(1, "Identity Proof is required"),
});

const bailiffSchemaValidation = z.object({
  badgeNumber: z.string().min(1, "Badge Number is required"),
  courtName: z.string().min(1, "Court Name is required"),
  identityProof: z.string().min(1, "Identity Proof is required"),
});

const judgeSchemaValidation = z.object({
  judgeId: z.string().min(3, "Judge ID is required"),
  courtName: z.string().min(5, "The court name is required, e.g., BOMBAY_HIGH_COURT"),
  designation: z.string().min(4, "Designation is required"),
  validTill: z.preprocess((arg) => (arg ? new Date(arg) : undefined), z.date().refine((date) => date > new Date(), "Valid Till must be a future date")),
  identityProof: z.string().min(1, "Identity Proof is required"),
});

const lawyerSchemaValidation = z.object({
  barCertificate: z.string().min(1, "Bar Certificate is required"),
  specialization: z.string().min(1, "Specialization is required"),
  ongoingCases: z.array(z.string()).optional().default([]),
  validTill: z.preprocess((arg) => (arg ? new Date(arg) : undefined), z.date().refine((date) => date > new Date(), "Valid Till must be a future date")),
  identityProof: z.string().min(1, "Identity Proof is required"),
});

const forensicExpertSchemaValidation = z.object({
  qualification: z.string().min(1, "Qualification is required"),
  areaOfExpertise: z.string().min(1, "Area of expertise is required"),
  identityProof: z.string().min(1, "Identity Proof is required"),
});

// Map role to schema
const roleSchemas = {
  police: policeSchemaValidation,
  bailiff: bailiffSchemaValidation,
  judge: judgeSchemaValidation,
  lawyer: lawyerSchemaValidation,
  forensic_expert: forensicExpertSchemaValidation,
};

// Example test case
const SignupValidation = (signupInput) => {
  try {
    const userValidationResult = registerUser.safeParse(signupInput.user);
    const roleValidationResult = roleSchemas[signupInput.user.role].safeParse(signupInput.roleDetails);
    
    if(userValidationResult.success && roleValidationResult.success){
      
      return({
        success:true,
        msg:{
          user: userValidationResult.data,
          role: roleValidationResult.data
        }
      });

    }else{
      if((!userValidationResult.success) && (!roleValidationResult.success)){

        return({
          success:false,
          msg:{
            user: userValidationResult.error,
            role: roleValidationResult.error
          }
        });

      }
      else if(!userValidationResult.success){

        return({
          success:false,
          msg:{
            user: userValidationResult.error,
            role: roleValidationResult.data
          }
        });

      }
      else{

        return({
          success:false,
          msg:{
            user: userValidationResult.data,
            role: roleValidationResult.error
          }
        });
      }
    }

  } catch (err) {
    console.error("Unexpected error:", err);
    return(err);
  }
};

const signinSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6,"enter a valid password")
});

const SigninValidation = (signinInput) =>{
  try {
    const validationResult = signinSchema.safeParse(signinInput);

    if(validationResult.success){
      return({
        success:true,
        msg:validationResult.data
      });
    }
    else{
      return({
        success:false,
        msg:validationResult.error
      });
    }
  } catch (err) {
    console.error("Unexpected error:",err);
    return(err);
  }
}

module.exports = {
  SignupValidation,
  SigninValidation
};