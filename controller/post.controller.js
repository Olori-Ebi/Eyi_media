import Post from "../model/post.model.js";
import Comment from "../model/comment.model.js";
import Follower from "../model/follower.model.js";
import User from "../model/user.model.js";
import * as uuid from "uuid";
import { Notifications } from "../utils/notifications.utils.js";
import mongoose from "mongoose";

export class PostController {
  static async createPosts(req, res) {
    const { title, description, liveDemo, sourceCode, techStack } = req.body;

    if (req.files.length < 1) {
      return res.status(400).json({ msg: "At least one image is required" });
    }

    try {
      const postObj = {
        user: req.id,
        title,
        description,
        images: req.files.map((file) => file.path),
        liveDemo,
        techStack,
      };
      if (sourceCode) postObj.sourceCode = sourceCode;

      const post = await new Post(postObj).save();
      await new Comment({ post: post._id, comments: [] }).save();

      res.status(201).json(post);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Server error" });
    }
  }

  static async likePost(req, res) {
    try {
      let post = await Post.findById({ _id: req.params.postId });
      if (!post) return res.status(404).json({ msg: "Post not found" });

      const isLiked =
        post.likes.filter((like) => like.user === req.id).length > 0;

      if (isLiked) {
        // Unlike the reply if already liked
        const index = post.likes.findIndex((like) => like.user === req.id);
        post.likes.splice(index, 1);
        post = await post.save();

        if (post.user !== req.id) {
          await Notifications.removeLikeNotification(
            post.user, //user to notify
            req.id, // user who liked
            req.params.postId
          );
        }

        res.status(200).json(post);
      } else {
        // Like the post
        post.likes.unshift({ user: req.id });
        post = await post.save();

        if (post.user !== req.id) {
          await Notifications.newLikeNotification(
            post.user, //user to notify
            req.id, // user who liked
            req.params.postId
          );
        }

        res.status(200).json(post);
      }
    } catch (error) {
      console.log(error);
    }
  }

  static async getPosts(req, res) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 12;

      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const total = await Post.countDocuments();

      const posts = await Post.find()
        .skip(startIndex)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate("user");

      let next = null;
      if (endIndex < total) {
        next = page + 1;
      }

      res.status(200).json({ posts, next });
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Server error" });
    }
  }

  static async getPost(req, res) {
    try {
      let post = await Post.findById(req.params.postId).populate("user");
      if (!post) {
        return res.status(404).json({ msg: "Post not found" });
      }
      post.views++;
      post = await post.save();
      res.status(200).json(post);
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Server error" });
    }
  }

  static async getPostLikes(req, res) {
    try {
      const post = await Post.findById(req.params.postId).populate(
        "likes.user"
      );
      if (!post) {
        return res.status(404).json({ msg: "Post not found" });
      }
      res.status(200).json(post.likes);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Server error" });
    }
  }

  static async deletePost(req, res) {
    try {
      const post = await Post.findById(req.params.postId);
      if (!post) {
        return res.status(404).json({ msg: "Post not found" });
      }
      const user = await User.findById(req.id);
      if (post.user.toString() === req.id || user.role === "root") {
        await post.remove();
        res.status(200).json({ msg: "Post deleted" });
      } else {
        res
          .status(401)
          .json({ msg: "You are not authorized to delete this post" });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Server error" });
    }
  }

  static async postComment(req, res) {
    try {
      if (req.body.text.length < 1) {
        return res
          .status(400)
          .json({ msg: "Comment must be atleast 1 character long" });
      }

      let post = await Comment.findOne({ post: req.params.postId });
      if (!post) {
        return res.status(404).json({ msg: "Post not found" });
      }

      const comment = {
        _id: uuid.v4(),
        user: req.id,
        text: req.body.text,
        date: Date.now(),
        likes: [],
        replies: [],
      };

      post.comments.unshift(comment);

      await post.save();
      post = await Comment.populate(post, "comments.user");
      post = await Comment.populate(post, "comments.replies.user");

      const postInfo = await Post.findById(req.params.postId);

      if (postInfo.user.toString() !== req.id) {
        await Notifications.newCommentNotification(
          postInfo.user.toString(), //user to notify
          req.id, // user who commented
          req.params.postId,
          comment._id,
          req.body.text
        );
      }

      res.status(201).json(post.comments);
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Server error" });
    }
  }

  static async getComments(req, res) {
    try {
      const post = await Comment.findOne({ post: req.params.postId })
        .populate("comments.user")
        .populate("comments.replies.user");

      if (!post) {
        return res.status(404).json({ msg: "Post not found" });
      }

      res.status(200).json(post.comments);
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Server error" });
    }
  }

  static async deleteComment(req, res) {
    try {
      let post = await Comment.findOne({ post: req.params.postId });
      if (!post) {
        return res.status(404).json({ msg: "Post not found" });
      }
      const comment = post.comments.find(
        (comment) => comment._id === req.params.commentId
      );

      if (!comment) {
        return res.status(404).json({ msg: "Comment not found" });
      }

      const user = await User.findById(req.id);
      if (comment.user.toString() === req.id || user.role === "root") {
        const index = post.comments.findIndex(
          (comment) => comment._id === req.params.commentId
        );
        post.comments.splice(index, 1);
        post = await post.save();

        post = await Comment.populate(post, "comments.user");
        post = await Comment.populate(post, "comments.replies.user");

        const postInfo = await Post.findById(req.params.postId);

        if (postInfo.user.toString() !== req.id) {
          await Notifications.removeCommentNotification(
            postInfo.user.toString(),
            req.id,
            req.params.postId,
            comment._id
          );
        }

        res.status(200).json(post.comments);
      } else {
        res
          .status(401)
          .json({ msg: "You are not authorized to delete this comment" });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Server error" });
    }
  }

  static async replyComment(req, res) {
    try {
      if (req.body.text.length < 1) {
        return res
          .status(400)
          .json({ msg: "Reply must be atleast 1 character long" });
      }
      let post = await Comment.findOne({ post: req.params.postId });
      if (!post) {
        return res.status(404).json({ msg: "Post not found" });
      }
      const reply = {
        _id: uuid.v4(),
        user: req.id,
        text: req.body.text,
        date: Date.now(),
        likes: [],
      };

      const commentToReply = post.comments.find(
        (comment) => comment._id === req.params.commentId
      );
      commentToReply.replies.push(reply);
      await post.save();

      post = await Comment.populate(post, "comments.user");
      post = await Comment.populate(post, "comments.replies.user");

      if (commentToReply.user._id.toString() !== req.id) {
        await Notifications.newReplyNotification(
          commentToReply.user._id.toString(),
          req.id,
          req.params.postId,
          reply._id,
          req.body.text
        );
      }

      res.status(201).json(post.comments);
    } catch (error) {
      console.log(error);
      res.status(500).json({ msg: "Server error" });
    }
  }

  static async deleteReply(req, res) {
    try {
      const post = await Comment.findOne({ post: req.params.postId });
      if (!post) {
        return res.status(404).json({ msg: "Post not found" });
      }
      const parentComment = post.comments.find(
        (comment) => comment._id === req.params.commentId
      );
      if (!parentComment) {
        return res.status(404).json({ msg: "Comment not found" });
      }
      const reply = parentComment.replies.find(
        (reply) => reply._id === req.params.replyId
      );
      if (!reply) {
        return res.status(404).json({ msg: "Reply not found" });
      }
      const user = await User.findById(req.id);

      if (reply.user.toString() === req.id || user.role === "root") {
        const index = parentComment.replies.findIndex(
          (reply) => reply._id === req.params.replyId
        );
        parentComment.replies.splice(index, 1);
        post = await post.save();

        post = await Comment.populate(post, "comments.user");
        post = await Comment.populate(post, "comments.replies.user");

        if (parentComment.user._id.toString() !== req.id) {
          await Notifications.removeReplyNotification(
            parentComment.user._id.toString(),
            req.id,
            req.params.postId,
            reply._id
          );
        }

        res.status(200).json(post.comments);
      } else {
        res
          .status(401)
          .json({ msg: "You are not authorized to delete this comment" });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ msg: "Server error" });
    }
  }

  static async likeOrUnlikeComment(req, res) {
    try {
      let post = await Comment.findOne({ post: req.params.postId });
      if (!post) {
        return res.status(404).json({ msg: "Post not found" });
      }
      let comment = post.comments.find(
        (comment) => comment._id === req.params.commentId
      );
      if (!comment) {
        return res.status(404).json({ msg: "Comment not found" });
      }
      const isLiked =
        comment.likes.filter((like) => like.user.toString() === req.id).length >
        0;

      if (isLiked) {
        // Unlike the comment if already liked
        const index = comment.likes.findIndex(
          (like) => like.user.toString() === req.id
        );
        comment.likes.splice(index, 1);
        post = await post.save();

        post = await Comment.populate(post, "comments.user");
        post = await Comment.populate(post, "comments.replies.user");

        if (comment.user._id.toString() !== req.id) {
          await Notifications.removeLikeNotification(
            comment.user._id.toString(),
            req.id,
            req.params.postId
          );
        }

        res.status(200).json(post.comments);
      } else {
        comment.likes.unshift({ user: req.id });
        post = await post.save();

        post = await Comment.populate(post, "comments.user");
        post = await Comment.populate(post, "comments.replies.user");
        if (comment.user._id.toString() !== req.id) {
          await Notifications.newLikeNotification(
            comment.user._id.toString(),
            req.id,
            req.params.postId
          );
        }

        res.status(200).json(post.comments);
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ msg: "Server error" });
    }
  }

  static async likeOrUnlikeReply(req, res) {
    try {
      let post = await Comment.findOne({ post: req.params.postId });
      if (!post) {
        return res.status(404).json({ msg: "Post not found" });
      }
      let comment = post.comments.find(
        (comment) => comment._id === req.params.commentId
      );
      if (!comment) {
        return res.status(404).json({ msg: "Comment not found" });
      }

      const reply = comment.replies.find(
        (reply) => reply._id === req.params.replyId
      );

      if (!reply) {
        return res.status(404).json({ msg: "Reply not found" });
      }

      const isLiked =
        reply.likes.filter((like) => like.user.toString() === req.id).length >
        0;

      if (isLiked) {
        // Unlike the reply if already liked
        const index = reply.likes.findIndex(
          (like) => like.user.toString() === req.id
        );
        reply.likes.splice(index, 1);
        post = await post.save();

        post = await Comment.populate(post, "comments.user");
        post = await Comment.populate(post, "comments.replies.user");

        if (reply.user.toString() !== req.id) {
          await Notifications.removeLikeNotification(
            reply.user._id.toString(), //user to notify
            req.id, // user who liked
            req.params.postId
          );
        }

        res.status(200).json(post.comments);
      } else {
        // Like the comment
        reply.likes.unshift({ user: req.id });
        post = await post.save();

        post = await Comment.populate(post, "comments.user");
        post = await Comment.populate(post, "comments.replies.user");

        if (reply.user._id.toString() !== req.id) {
          await Notifications.newLikeNotification(
            reply.user._id.toString(), //user to notify
            req.id, // user who liked
            req.params.postId
          );
        }

        res.status(200).json(post.comments);
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ msg: "Server error" });
    }
  }

  static async getFollowersPosts(req, res) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 12;
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;

      const user = await Follower.findOne({ user: req.id }).select(
        "-followers"
      );
      const followingUsers = user.following.map((following) => following.user);

      const total = await Post.countDocuments({
        user: { $in: followingUsers },
      });

      const posts = await Post.find({ user: { $in: followingUsers } })
        .skip(startIndex)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate("user");

      let next = null;
      if (endIndex < total) {
        next = page + 1;
      }

      res.status(200).json({ posts, next });
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Server error" });
    }
  }

  static async getSavedPosts(req, res) {
    try {
      const saves = await Post.find({
        "saves.user": mongoose.Types.ObjectId(req.id),
      }).populate("user");
      res.status(200).json(saves);
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Server error" });
    }
  }

  static async savePost(req, res) {
    try {
      let post = await Post.findById(req.params.postId);
      if (!post) {
        return res.status(404).json({ msg: "Post not found" });
      }

      const isSaved =
        post.saves.filter((save) => save.user.toString() === req.id).length > 0;

      if (isSaved) {
        // Unsave the post if already saved
        const index = post.saves.findIndex(
          (save) => save.user.toString() === req.id
        );
        post.saves.splice(index, 1);
        await post.save();
        res.status(200).json(post);
      } else {
        // Save the post
        post.saves.unshift({ user: req.id });
        await post.save();
        res.status(200).json(post);
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Server error" });
    }
  }
}
