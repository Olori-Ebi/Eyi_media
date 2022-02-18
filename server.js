import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRouter from "./route/user.route.js";
import postRouter from "./route/post.route.js";
import notificationRouter from "./route/notification.route.js";
import profileRouter from "./route/profile.route.js";
dotenv.config();

const app = express();
const port = process.env.PORT || 5502;

//Init BodyParser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/", authRouter, postRouter, notificationRouter, profileRouter);

connectDB();

app.get("/", (req, res) => {
  res.status(200).json({
    status: 200,
    msg: "Congratulations on finding your way around your first endpoint!!!!",
  });
});

app.listen(port, () => {
  console.log(`server started at ${port}`);
});

export default app;
