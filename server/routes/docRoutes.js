const express = require("express");
const controller = require('../controllers/docController.js');
const { authenticate, authorize } = require("../middleware/auth.js");
const upload = require("../middleware/upload.js")

const router = express.Router();

router.get("/:id", controller.getDocsByBot);

router.post("/", upload.single("file"), controller.createDoc);

router.delete("/:id", controller.deleteDoc);

module.exports = router;