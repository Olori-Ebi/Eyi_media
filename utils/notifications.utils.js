import Notification from "../model/notification.model.js";
import User from "../model/user.model.js";

export class Notifications {
  static async newCommentNotification(
    userToNotifyId,
    userWhoCommentedId,
    postId,
    commentId,
    commentText
  ) {
    try {
      const userToNotify = await Notification.findOne({ user: userToNotifyId });
      const notification = {
        type: "comment",
        user: userWhoCommentedId,
        post: postId,
        commentId,
        text: commentText,
        date: Date.now(),
      };

      userToNotify.notifications.unshift(notification);
      await userToNotify.save();

      await setNotificationsToUnread(userToNotifyId);
    } catch (error) {
      console.error(error);
    }
  }

  static async removeCommentNotification(
    userToNotifyId,
    userWhoCommentedId,
    postId,
    commentId
  ) {
    try {
      await Notification.findOneAndUpdate(
        { user: userToNotifyId },
        {
          $pull: {
            notifications: {
              type: "comment",
              user: userWhoCommentedId,
              post: postId,
              commentId,
            },
          },
        }
      );
    } catch (error) {
      console.error(error);
    }
  }

  static async newReplyNotification(
    userToNotifyId,
    userWhoCommentedId,
    postId,
    commentId,
    commentText
  ) {
    try {
      const userToNotify = await Notification.findOne({ user: userToNotifyId });
      const notification = {
        type: "reply",
        user: userWhoCommentedId,
        post: postId,
        commentId,
        text: commentText,
        date: Date.now(),
      };

      userToNotify.notifications.unshift(notification);
      await userToNotify.save();

      await setNotificationsToUnread(userToNotifyId);
    } catch (error) {
      console.error(error);
    }
  }

  static async removeReplyNotification(
    userToNotifyId,
    userWhoCommentedId,
    postId,
    commentId
  ) {
    try {
      await Notification.findOneAndUpdate(
        { user: userToNotifyId },
        {
          $pull: {
            notifications: {
              type: "reply",
              user: userWhoCommentedId,
              post: postId,
              commentId,
            },
          },
        }
      );
    } catch (error) {
      console.error(error);
    }
  }

  static async newLikeNotification(userToNotifyId, userWhoLikedId, postId) {
    try {
      const userToNofify = await Notification.findOne({ user: userToNotifyId });
      const notification = {
        type: "like",
        user: userWhoLikedId,
        post: postId,
        date: Date.now(),
      };

      userToNofify.notifications.unshift(notification);
      await userToNofify.save();

      await setNotificationsToUnread(userToNotifyId);
    } catch (error) {
      console.error(error);
    }
  }

  static async removeLikeNotification(userToNotifyId, userWhoLikedId, postId) {
    try {
      await Notification.findOneAndUpdate(
        { user: userToNotifyId },
        {
          $pull: {
            notifications: {
              type: "like",
              user: userWhoLikedId,
              post: postId,
            },
          },
        }
      );
    } catch (error) {
      console.error(error);
    }
  }

  static async newFollowerNotification(userToNotifyId, userWhoFollowedId) {
    try {
      const userToNotify = await Notification.findOne({ user: userToNotifyId });
      const notification = {
        type: "follow",
        user: userWhoFollowedId,
        date: Date.now(),
      };

      userToNotify.notifications.unshift(notification);
      await userToNotify.save();

      await setNotificationsToUnread(userToNotifyId);
    } catch (error) {
      console.error(error);
    }
  }

  static async removeFollowerNotification(userToNotifyId, userWhoFollowedId) {
    try {
      await Notification.findOneAndUpdate(
        { user: userToNotifyId },
        {
          $pull: { notifications: { type: "follow", user: userWhoFollowedId } },
        }
      );
    } catch (error) {
      console.error(error);
    }
  }
}

const setNotificationsToUnread = async (id) => {
  try {
    const user = await User.findById(id);
    if (!user.unreadNotification) {
      user.unreadNotification = true;
      await user.save();
    }
  } catch (error) {
    console.error(error);
  }
};
