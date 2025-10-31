const express = require("express");
const controller = require('../controllers/botController.js');
const { authenticate, authorize } = require("../middleware/auth.js");

const router = express.Router();

router.get("/:id", controller.getBotById);

router.get("/", controller.getAllBots);

router.post("/", controller.createBot);

router.put("/:id", controller.updateBot);

router.delete("/:id", controller.deleteBot);

router.post("/:id/duplicate", controller.duplicateInstanceFromBot);

module.exports = router;