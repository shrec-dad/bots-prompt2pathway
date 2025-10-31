const multer = require('multer');
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");
const path = require("path");

const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    return {
      folder: "docs",
      resource_type: "raw",
      type: "upload",
      public_id: `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`,
      format: path.extname(file.originalname).slice(1)
    }
  },
});

const upload = multer({ storage });

module.exports = upload;
