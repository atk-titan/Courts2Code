const mongoose = require("mongoose");
require("dotenv").config();

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB connection successful"))
  .catch((err) => console.log("Error while connecting to MongoDB: ", err));

// Define the user schema
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["police", "bailiff", "judge", "lawyer", "forensic_expert"],
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Verified", "Rejected"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

// Define the case schema
// Define the case schema with lawyer references for each party
const caseSchema = new mongoose.Schema(
  {
    caseNumber: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String },
    parties: { type: [String], required: true }, // e.g., names or identifiers of the parties
    lawyerId: { type: [mongoose.Schema.Types.ObjectId], ref: "Lawyer", required: true },
    judge: { type: String, required: true },       // judge identifier (could be name or ID)
    courtName: { type: String, required: true },
    status: {
      type: String,
      enum: ["Open", "Closed", "Pending"],
      default: "Pending",
    }
  },
  { timestamps: true }
);

// Define the police schema
const policeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    badgeNumber: { type: String, required: true, unique: true },
    department: { type: String, required: true },
    stationAddress: { type: String, required: true },
    identityProof: { type: String, required: true }, // Path to the uploaded file
  },
  { timestamps: true }
);

// Define the bailiff schema
const bailiffSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    badgeNumber: { type: String, required: true, unique: true },
    courtName: { type: String, required: true },
    identityProof: { type: String, required: true }, // Path to the uploaded file
  },
  { timestamps: true }
);

// Define the judge schema
const judgeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    judgeId: { type: String, required: true, unique: true },
    courtName: { type: String, required: true },
    designation: { type: String, required: true },
    validTill: { type: Date, required: true },
    identityProof: { type: String, required: true }, // Path to the uploaded file
  },
  { timestamps: true }
);

// Define the lawyer schema
const lawyerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    barCertificate: { type: String, required: true }, // Path to the uploaded bar certificate file
    specialization: { type: String, required: true },
    ongoingCases: { type: [mongoose.Schema.Types.ObjectId], ref: "Case", default: [], required: true },
    validTill: { type: Date, required: true },
    identityProof: { type: String, required: true }, // Path to the uploaded file
  },
  { timestamps: true }
);

// Define the forensic expert schema
const forensicExpertSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    qualification: { type: String, required: true },
    areaOfExpertise: { type: String, required: true },
    identityProof: { type: String, required: true }, // Path to the uploaded file
  },
  { timestamps: true }
);

// Create models for each schema
const User = mongoose.model("User", userSchema);
const Case = mongoose.model("Case", caseSchema);
const Police = mongoose.model("Police", policeSchema);
const Bailiff = mongoose.model("Bailiff", bailiffSchema);
const Judge = mongoose.model("Judge", judgeSchema);
const Lawyer = mongoose.model("Lawyer", lawyerSchema);
const ForensicExpert = mongoose.model("ForensicExpert", forensicExpertSchema);

// Export all models
module.exports = {
  User,
  Case,
  Police,
  Bailiff,
  Judge,
  Lawyer,
  ForensicExpert,
};