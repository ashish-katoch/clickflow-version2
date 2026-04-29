const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUrl = process.env.MONGO_URL;
  const dbName = process.env.DB_NAME;

  if (!mongoUrl || !dbName) {
    console.error('MONGO_URL and DB_NAME must be set in .env');
    process.exit(1);
  }

  await mongoose.connect(`${mongoUrl}/${dbName}`);
  console.log(`MongoDB connected: ${dbName}`);
};

module.exports = connectDB;
