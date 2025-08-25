import { Request } from "express";
import fs from "fs";
import path from "path";
import multer from "multer";

const uploadFolder = path.join(process.cwd(), "uploads", "products");
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    cb(null, uploadFolder);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const filename = `${uniqueSuffix}${ext}`;
    cb(null, filename);
  },
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: any) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"));
  }
};

export const uploadImage = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter,
});

export const deleteFile = (filePath: string): void => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlink(filePath, (error) => {
      if (error) console.error("Error deleting file:", error);
    });
  }
};
