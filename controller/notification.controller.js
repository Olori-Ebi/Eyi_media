import Notification from "../model/notification.model.js";
import User from "../model/user.model.js";

export class NotificationController {
  static async getUserNotifications(req, res) {
    try {
      const user = await Notification.findOne({ user: req.id })
        .populate("notifications.user")
        .populate("notifications.post");
      const notifications = user.notifications.filter(
        (notification) =>
          ((notification.type === "like" ||
            notification.type === "comment" ||
            notification.type === "reply") &&
            notification.user?._id &&
            notification.post?._id) ||
          (notification.type === "follow" && notification.user?._id) ||
          notification.type === "badge"
      );
      res.status(200).json(notifications);
    } catch (error) {
      console.error(err);
      res.status(500).json({ msg: "Server error" });
    }
  }

  static async setUserNotificationToRead(req, res) {
    try {
      const user = await User.findById(req.id);
      if (user.unreadNotification) {
        user.unreadNotification = false;
        await user.save();
      }
      res.status(200).json({ msg: "Updated unread notification status" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Server error" });
    }
  }
}
