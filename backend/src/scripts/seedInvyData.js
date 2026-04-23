require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const connectDB = require("../config/db");
const User = require("../models/User");
const Category = require("../models/Category");
const Item = require("../models/Item");

const seedUsers = [
  {
    name: "Invy Admin",
    email: "admin@invy.local",
    phone: "+919876543210",
    password: "Admin@123",
    role: "admin",
  },
  {
    name: "Invy User",
    email: "user@invy.local",
    phone: "+919123456789",
    password: "User@123",
    role: "user",
  },
];

const seedCategoryNames = [
  "Electronics",
  "Office",
  "Cleaning",
];

const seedItems = [
  {
    name: "Wireless Mouse",
    quantity: 18,
    price: 799,
    category: "Electronics",
  },
  {
    name: "A4 Paper Pack",
    quantity: 42,
    price: 320,
    category: "Office",
  },
  {
    name: "Surface Cleaner",
    quantity: 12,
    price: 185,
    category: "Cleaning",
  },
];

const upsertUsers = async () => {
  for (const userData of seedUsers) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    await User.findOneAndUpdate(
      { email: userData.email },
      {
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        password: hashedPassword,
        role: userData.role,
      },
      {
        upsert: true,
        returnDocument: "after",
        setDefaultsOnInsert: true,
      }
    );
  }
};

const upsertCategories = async () => {
  const categoryMap = new Map();

  for (const name of seedCategoryNames) {
    const category = await Category.findOneAndUpdate(
      { name },
      { name },
      {
        upsert: true,
        returnDocument: "after",
        setDefaultsOnInsert: true,
      }
    );

    categoryMap.set(name, category._id);
  }

  return categoryMap;
};

const upsertItems = async (categoryMap) => {
  for (const itemData of seedItems) {
    await Item.findOneAndUpdate(
      { name: itemData.name },
      {
        name: itemData.name,
        quantity: itemData.quantity,
        price: itemData.price,
        category: categoryMap.get(itemData.category),
      },
      {
        upsert: true,
        returnDocument: "after",
        setDefaultsOnInsert: true,
        runValidators: true,
      }
    );
  }
};

const main = async () => {
  try {
    await connectDB();
    await upsertUsers();
    const categoryMap = await upsertCategories();
    await upsertItems(categoryMap);

    console.log("Seeded invy database with users, categories, and items.");
    console.log("Admin login: admin@invy.local / Admin@123");
    console.log("User login: user@invy.local / User@123");
  } catch (error) {
    console.error("Failed to seed invy database:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

main();
