const mongoose = require("mongoose");

const footerSettingsSchema = new mongoose.Schema({
  content: {
    type: String,
  },
  topsearches: {
    type: String,
  },
});

const footerSettingModal = mongoose.model(
  "footersetting",
  footerSettingsSchema
);

module.exports = footerSettingModal;
