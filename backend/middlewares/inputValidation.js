const { z } = require("zod");  // Correct import
const { Bailiff, Judge } = require("../mongo");

const registerUser = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(150, "Name should not exceed 150 characters"),
  
  email: z
    .string()
    .email("Invalid email address"),
  
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long"),
  
  role: z
    .string()
    .refine(val => ["police", "bailiff", "judge", "lawyer", "forensic_expert"].includes(val), {
      message: "Role must be one of the following: police, bailiff, judge, lawyer, forensic_expert"
    }),

  status: z
    .string()
    .refine(val => ["Pending", "Verified", "Rejected"].includes(val), {
      message: "Status must be one of the following: Pending, Verified, Rejected"
    })
    .default("Pending")
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
    judgeId: z.string().min(3,"judgeID is required"),
    courtName: z.string().min(5,"the court name is required like BOMBAY_HIGH_COURT"),
    designation: z.string().min(4,"your designation at the court"),
    validTill: z.preprocess((arg) => (arg ? new Date(arg) : undefined), z.date().refine((date) => date > new Date(), "Valid Till must be a future date")),
    identityProof: z.string().min(1, "Identity Proof is required"),
});

const lawyerSchemaValidation = z.object({
    barCertificate: z.string().min(1, "Bar Certificate is required"),
    specialization: z.string().min(1, "Specialization is required"),
    validTill: z.preprocess((arg) => (arg ? new Date(arg) : undefined), z.date().refine((date) => date > new Date(), "Valid Till must be a future date")),
    identityProof: z.string().min(1, "Identity Proof is required"),
});

const forensicExpertSchemaVaidation = z.object({
    qualification: z.string().min(1,"qaulification daal lwde"),
    areaOfExpertise: z.string().min(1,"area of expertise bhi daal lwde"),
    identityProof:  z.string().min(1, "Identity Proof is required"),
})
  
  // Map role to schema
  const roleSchemas = {
    police: policeSchemaValidation,
    bailiff:bailiffSchemaValidation,
    judge:judgeSchemaValidation,
    lawyer: lawyerSchemaValidation,
    forensic_expert: forensicExpertSchemaVaidation
  };
  
  // Combined validation schema
  const signupSchemaValidation = z.object({
    user: userSchemaValidation,
    roleDetails: z
      .object({})
      .refine((data, ctx) => {
        const role = ctx.parent.user.role; // Access the role from the parent schema
        const roleSchema = roleSchemas[role];
        if (!roleSchema) {
          ctx.addIssue({
            path: ["roleDetails"],
            message: `Validation schema for role "${role}" not found.`,
          });
          return false;
        }
  
        const result = roleSchema.safeParse(data);
        if (!result.success) {
          ctx.addIssue({
            path: ["roleDetails"],
            message: result.error.errors.map((err) => err.message).join(", "),
          });
          return false;
        }
  
        return true;
      }, "Invalid role details"),
  });
  
  // Example input
  const signupInput = {
    user: {
      name: "John Doe",
      email: "john.doe@example.com",
      password: "password123",
      role: "lawyer", // Determines which schema to validate
      status: "Pending",
    },
    roleDetails: {
      barCertificate: "/uploads/bar_certificate.pdf",
      specialization: "Criminal Law",
      validTill: "2026-01-01",
      identityProof: "/uploads/identity_proof.pdf",
    },
  };
  
  // Validate input
  (async () => {
    try {
      const validationResult = signupSchemaValidation.safeParse(signupInput);
  
      if (!validationResult.success) {
        console.error("Validation errors:", validationResult.error.errors);
      } else {
        const { user, roleDetails } = validationResult.data;
  
        // Save the user
        const newUser = new User(user);
        const savedUser = await newUser.save();
  
        // Save role-specific data
        const roleModel = {
          lawyer: Lawyer,
          police: Police,
          // Add other models here
        }[user.role];
  
        const newRoleDetails = new roleModel({ ...roleDetails, userId: savedUser._id });
        await newRoleDetails.save();
  
        console.log("User and role details registered successfully");
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    }
  })();  