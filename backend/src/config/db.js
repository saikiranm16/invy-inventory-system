const mongoose = require("mongoose");
const { ensureDemoInventory } = require("../utils/seedInventory");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");
    await ensureDemoInventory();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

module.exports = connectDB;
