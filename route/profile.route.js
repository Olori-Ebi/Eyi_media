import express from "express";
import { ProfileController } from "../controller/profile.controller.js";
import auth from "../middleware/auth.middleware.js";

const profileRouter = express.Router();

profileRouter
  .route("/api/v1/profile")
  .get(auth, ProfileController.getLoggedInUserProfile);

profileRouter
  .route("/api/v1/profile")
  .put(auth, ProfileController.updateUserProfile);

profileRouter
  .route("/api/v1/profile/:username")
  .get(auth, ProfileController.getUserProfile);

profileRouter
  .route("/api/v1/profile/:username/followings")
  .get(auth, ProfileController.getUserFollowingsProfile);

profileRouter
  .route("/api/v1/profile/follow/:userId")
  .get(auth, ProfileController.followOrUnfollowUser);

export default profileRouter;
