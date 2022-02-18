import User from "../model/user.model.js";
import Profile from "../model/profile.model.js";
import Follower from "../model/follower.model.js";
import Post from "../model/post.model.js";
import { Notifications } from "../utils/notifications.utils.js";

export class ProfileController {
  static async getUserProfile(req, res) {
    try {
      const user = await User.findOne({
        username: req.params.username.toLowerCase(),
      });
      if (!user) {
        return res.status(404).json({ msg: "User not found" });
      }
      const profile = await Profile.findOne({ user: user._id }).populate(
        "user"
      );
      const follow = await Follower.findOne({ user: user._id });

      const posts = await Post.find({ user: user._id })
        .sort({ createdAt: -1 })
        .populate("user");

      res.status(200).json({
        profile,
        followers: follow.followers,
        following: follow.following,
        posts,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Server error" });
    }
  }

  static async getUserFollowingsProfile(req, res) {
    try {
      const user = await User.findOne({
        username: req.params.username.toLowerCase(),
      });
      if (!user) {
        return res.status(404).json({ msg: "User not found" });
      }
      const following = await Follower.findOne({ user: user._id }).populate(
        "following.user"
      );
      res.status(200).json(following.following);
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Server error" });
    }
  }

  static async followOrUnfollowUser(req, res) {
    try {
      const loggedInUser = await Follower.findOne({ user: req.id });
      const userToFollowOrUnfollow = await Follower.findOne({
        user: req.params.userId,
      });
      // If either of the user is not found, return error
      if (!loggedInUser || !userToFollowOrUnfollow)
        return res.status(404).json({ msg: "User not found" });
      // Check if logged in user is already following the other user (req.params.userId)
      const isFollowing =
        loggedInUser.following.length > 0 &&
        loggedInUser.following.filter(
          (following) => following.user.toString() === req.params.userId
        ).length > 0;
      if (isFollowing) {
        // Unfollow the user if already follwing
        let index = loggedInUser.following.findIndex(
          (following) => following.user.toString() === req.params.userId
        );
        loggedInUser.following.splice(index, 1);
        await loggedInUser.save();

        index = userToFollowOrUnfollow.followers.findIndex(
          (follower) => follower.user.toString() === req.id
        );
        userToFollowOrUnfollow.followers.splice(index, 1);
        await userToFollowOrUnfollow.save();

        await Notifications.removeFollowerNotification(
          req.params.userId,
          req.id
        );

        res.status(200).json(userToFollowOrUnfollow.followers);
      } else {
        loggedInUser.following.unshift({ user: req.params.userId });
        await loggedInUser.save();

        userToFollowOrUnfollow.followers.unshift({ user: req.id });
        await userToFollowOrUnfollow.save();
        await Notifications.newFollowerNotification(req.params.userId, req.id);
        res.status(200).json(userToFollowOrUnfollow.followers);
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Server error" });
    }
  }

  static async getLoggedInUserProfile(req, res) {
    try {
      const profile = await Profile.findOne({ user: req.id });
      if (!profile) {
        return res.status(404).json({ msg: "Profile not found" });
      }
      res.status(200).json(profile);
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Server error" });
    }
  }

  static async updateUserProfile(req, res) {
    try {
      const { bio, techStack, social } = req.body;

      let profile = await Profile.findOne({ user: req.id });
      if (!profile) {
        return res.status(404).json({ msg: "Profile not found" });
      }

      profile = await Profile.findOneAndUpdate(
        { user: req.id },
        { bio, techStack, social },
        { new: true }
      );

      res.status(200).json(profile);
      return;
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Server error" });
      return;
    }
  }
}
