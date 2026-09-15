const mongoose = require('mongoose');

const watanMasterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Watan name is required'],
      unique: true,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WatanMaster', watanMasterSchema);
