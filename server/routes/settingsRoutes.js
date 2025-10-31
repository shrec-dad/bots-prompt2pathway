const express = require("express");
const router = express.Router();
const controller = require("../controllers/settingsController.js");

router.get("/:key", controller.getSettingsByKey);
router.post("/:key", controller.updateSettingsByKey);
module.exports = router;