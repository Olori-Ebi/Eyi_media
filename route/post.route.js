import express from "express";
import { PostController } from "../controller/post.controller.js";
import auth from "../middleware/auth.middleware.js";
import upload from "../middleware/multer.js";

const postRouter = express.Router();

postRouter
  .route("/api/v1/posts")
  .post(auth, upload.array("images", 5), PostController.createPosts);

postRouter.route("/api/v1/like/:postId").put(auth, PostController.likePost);

postRouter.route("/api/v1/posts").get(PostController.getPosts);

postRouter.route("/api/v1/posts/postId").get(PostController.getPost);

postRouter.route("/api/v1/posts/postId").get(PostController.getPostLikes);

postRouter.route("/api/v1/posts/postId").delete(PostController.deletePost);

postRouter
  .route("/api/v1/comments/:postId")
  .post(auth, PostController.postComment);

postRouter
  .route("/api/v1/comments/:postId")
  .get(auth, PostController.getComments);

postRouter
  .route("/api/v1/comments/:postId/:commentId")
  .delete(auth, PostController.deleteComment);

postRouter
  .route("/api/v1/comments/:postId/:commentId")
  .post(auth, PostController.replyComment);

postRouter
  .route("/api/v1/comments/:postId/:commentId/:replyId")
  .delete(auth, PostController.deleteReply);

postRouter
  .route("/api/v1/like/:postId/:commentId")
  .put(auth, PostController.likeOrUnlikeComment);

postRouter
  .route("/api/v1/like/:postId/:commentId/:replyId")
  .put(auth, PostController.likeOrUnlikeReply);

postRouter
  .route("/api/v1/posts/feed")
  .get(auth, PostController.getFollowersPosts);

postRouter
  .route("/api/v1/profile/saves")
  .get(auth, PostController.getSavedPosts);

postRouter
  .route("/api/v1/posts/save/postId")
  .put(auth, PostController.savePost);

export default postRouter;
