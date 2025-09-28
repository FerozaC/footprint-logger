const mongoose = require("mongoose");

const ActivitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  co2: { type: Number, required: true },
  category: { type: String, required: true },
  date: { type: Date, required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Activity", ActivitySchema);
