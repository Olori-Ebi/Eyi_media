import express from "express";
import { UserController } from "../controller/user.controller.js";
import auth from "../middleware/auth.middleware.js";
import upload from "../middleware/multer.js";

const authRouter = express.Router();

authRouter.route("/api/v1/auth/signup").post(UserController.signup);
authRouter
  .route("/onboarding/:token")
  .post(upload.single("profilePicUrl"), UserController.completeOnboard);

authRouter.route("/api/v1/auth/signin").post(UserController.signin);
authRouter
  .route("/api/v1/auth/info")
  .get(auth, UserController.getLoggedInUserInfo);

authRouter
  .route("/api/v1/auth/info")
  .put(auth, upload.single("profilePicUrl"), UserController.updateUserInfo);

authRouter
  .route("/api/v1/auth/password")
  .put(auth, UserController.updatePassword);

authRouter
  .route("/api/v1/auth/forgot-password")
  .post(UserController.forgotPassword);

authRouter.route("/reset-password/:token").put(UserController.resetPassword);

export default authRouter;
