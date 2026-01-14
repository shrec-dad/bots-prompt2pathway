const express = require("express");
const controller = require("../controllers/userController.js");
const { authenticate, authorize } = require("../middleware/auth.js");

const router = express.Router();

router.post("/signup", controller.signup);
router.post("/login", controller.login);
router.post("/forgot-password", controller.forgotPassword);
router.post("/reset-password", controller.resetPassword);
router.get("/",  controller.getUsers);
router.post("/",  controller.addUser);
router.put("/:id",  controller.updateUser);
router.delete("/:id",  controller.deleteUser);

module.exports = router;