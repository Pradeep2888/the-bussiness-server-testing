const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please tell us your name!"],
  },
  email: {
    type: String,
    required: [true, "Please provide your email"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email"],
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: 8,
    select: false,
  },
  address: {
    type: String,
    default: null,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  image: {
    type: String,
    default: null,
  },
  phone: {
    type: String,
    default: null,
  },
  createdAt: Date,
  verification: {
    type: String,
  },
});

userSchema.pre("save", function (next) {
  this.createdAt = Date.now();
  next();
});

userSchema.pre("save", async function (next) {
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model("User", userSchema);

module.exports = User;

//et0QoVu6=U;!
//thepwpolikno_tbr
