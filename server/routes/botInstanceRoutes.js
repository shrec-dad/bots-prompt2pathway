const express = require("express");
const controller = require('../controllers/botInstanceController.js');
const { authenticate, authorize } = require("../middleware/auth.js");

const router = express.Router();

router.get("/:id", controller.getInstanceById);

router.get("/", controller.getAllInstances);

router.post("/", controller.createInstance);

router.put("/:id", controller.updateInstance);

router.delete("/:id", controller.deleteInstance);

module.exports = router;