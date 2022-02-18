import multer from "multer";
import path from "path";

const upload = multer({
  storage: multer.diskStorage({}),
  fileFilter: (req, file, callback) => {
    let ext = path.extname(file.originalname);
    if (ext !== ".jpg" && ext !== ".jpeg" && ext !== ".png") {
      callback(new Error("File type is not supported."), false);
      return;
    }
    callback(null, true);
  },
});

export default upload;
