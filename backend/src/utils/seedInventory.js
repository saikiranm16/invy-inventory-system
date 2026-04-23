const Category = require("../models/Category");
const Item = require("../models/Item");

const demoInventory = {
  Electronics: [
    { name: "Wireless Mouse", quantity: 34, price: 799 },
    { name: "Mechanical Keyboard", quantity: 18, price: 2899 },
    { name: "27-inch Monitor", quantity: 9, price: 15499 },
    { name: "USB-C Hub", quantity: 22, price: 1899 },
    { name: "Noise Cancelling Headset", quantity: 12, price: 5499 },
    { name: "Portable SSD 1TB", quantity: 14, price: 7499 },
    { name: "Webcam Full HD", quantity: 16, price: 2499 },
  ],
  Accessories: [
    { name: "Laptop Sleeve 15 inch", quantity: 20, price: 999 },
    { name: "Phone Charging Cable", quantity: 48, price: 399 },
    { name: "Power Bank 20000mAh", quantity: 13, price: 1999 },
    { name: "Bluetooth Speaker", quantity: 11, price: 2599 },
    { name: "Wireless Presenter", quantity: 8, price: 1499 },
    { name: "Ergonomic Mouse Pad", quantity: 27, price: 349 },
    { name: "Cable Organizer Kit", quantity: 30, price: 299 },
  ],
  "Office Supplies": [
    { name: "A4 Printer Paper Pack", quantity: 60, price: 325 },
    { name: "Gel Pen Set", quantity: 45, price: 210 },
    { name: "Permanent Marker Pack", quantity: 24, price: 180 },
    { name: "Sticky Notes Stack", quantity: 38, price: 120 },
    { name: "Clipboard Board", quantity: 19, price: 160 },
    { name: "Document Folder", quantity: 35, price: 95 },
    { name: "Desktop Stapler", quantity: 17, price: 290 },
  ],
  Furniture: [
    { name: "Ergonomic Office Chair", quantity: 7, price: 8499 },
    { name: "Standing Desk", quantity: 5, price: 18999 },
    { name: "Two Drawer Cabinet", quantity: 6, price: 6299 },
    { name: "Conference Table", quantity: 3, price: 22499 },
    { name: "Visitor Chair", quantity: 15, price: 2499 },
    { name: "Open Shelf Rack", quantity: 9, price: 5599 },
    { name: "Foot Rest", quantity: 14, price: 899 },
  ],
  Kitchen: [
    { name: "Electric Kettle", quantity: 10, price: 1399 },
    { name: "Coffee Jar", quantity: 12, price: 349 },
    { name: "Water Dispenser Bottle", quantity: 21, price: 220 },
    { name: "Ceramic Mug Set", quantity: 26, price: 499 },
    { name: "Snack Storage Box", quantity: 18, price: 299 },
    { name: "Mini Refrigerator", quantity: 4, price: 10999 },
    { name: "Microwave Oven", quantity: 5, price: 8299 },
  ],
  Cleaning: [
    { name: "Floor Cleaner Bottle", quantity: 28, price: 189 },
    { name: "Hand Sanitizer Pump", quantity: 33, price: 149 },
    { name: "Tissue Box Carton", quantity: 24, price: 399 },
    { name: "Disinfectant Spray", quantity: 16, price: 279 },
    { name: "Microfiber Cloth Pack", quantity: 20, price: 225 },
    { name: "Trash Bag Roll", quantity: 29, price: 175 },
    { name: "Toilet Cleaner Pack", quantity: 14, price: 210 },
  ],
  Storage: [
    { name: "Archive Storage Bin", quantity: 11, price: 749 },
    { name: "Label Maker", quantity: 6, price: 2199 },
    { name: "Shelf Basket", quantity: 15, price: 359 },
    { name: "Plastic Organizer Tray", quantity: 17, price: 249 },
    { name: "Lockable Storage Box", quantity: 8, price: 1299 },
    { name: "Barcode Labels Pack", quantity: 25, price: 199 },
    { name: "Cable Storage Crate", quantity: 9, price: 599 },
  ],
  Wellness: [
    { name: "First Aid Kit", quantity: 9, price: 899 },
    { name: "Instant Cold Pack", quantity: 15, price: 149 },
    { name: "Air Purifier", quantity: 6, price: 6499 },
    { name: "Humidifier", quantity: 7, price: 2299 },
    { name: "Yoga Mat", quantity: 12, price: 699 },
    { name: "Foam Roller", quantity: 10, price: 799 },
    { name: "Eye Wash Bottle", quantity: 18, price: 129 },
  ],
};

const ensureDemoInventory = async () => {
  const categoryMap = new Map();
  let seededCategories = 0;
  let seededProducts = 0;

  for (const categoryName of Object.keys(demoInventory)) {
    const existingCategory = await Category.findOne({ name: categoryName });

    if (existingCategory) {
      categoryMap.set(categoryName, existingCategory);
      continue;
    }

    const category = await Category.create({ name: categoryName });
    categoryMap.set(categoryName, category);
    seededCategories += 1;
  }

  for (const [categoryName, products] of Object.entries(demoInventory)) {
    const category = categoryMap.get(categoryName);

    for (const product of products) {
      const existingProduct = await Item.findOne({ name: product.name });

      if (existingProduct) {
        continue;
      }

      await Item.create({
        ...product,
        category: category._id,
      });
      seededProducts += 1;
    }
  }

  return {
    totalCategories: Object.keys(demoInventory).length,
    totalProducts: Object.values(demoInventory).flat().length,
    seededCategories,
    seededProducts,
  };
};

module.exports = {
  ensureDemoInventory,
};
