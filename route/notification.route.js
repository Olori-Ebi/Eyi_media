import express from "express";
import { NotificationController } from "../controller/notification.controller.js";
import auth from "../middleware/auth.middleware.js";

const notificationRouter = express.Router();

notificationRouter
  .route("/api/v1/notifications")
  .get(auth, NotificationController.getUserNotifications);

notificationRouter
  .route("/api/v1/notifications")
  .post(auth, NotificationController.setUserNotificationToRead);

export default notificationRouter;
