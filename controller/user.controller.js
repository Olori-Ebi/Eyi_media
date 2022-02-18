import helperUtils from "../helper/index.js";
import User from "../model/user.model.js";
import Profile from "../model/profile.model.js";
import Notification from "../model/notification.model.js";
import Chat from "../model/chats.model.js";
import Follower from "../model/follower.model.js";
import crypto from "crypto";
import mailer from "../middleware/sendMail.js";

const fromUser = process.env.FROM;

export class UserController {
  static async signup(req, res) {
    const { name, username, email, password } = req.body;

    if (password.length < 6) {
      return res
        .status(400)
        .json({ msg: "Password must be atleast 6 characters long" });
    }

    try {
      let user = await User.findOne({ email: email.toLowerCase() });
      if (user) {
        return res.status(400).json({ msg: "You are already registered" });
      }

      // Check if username is already taken
      user = await User.findOne({ username: username.toLowerCase() });
      if (user) {
        return res.status(400).json({ msg: "Username is already taken" });
      }

      let hashedPassword = helperUtils.hashPassword(password);
      user = new User({
        name,
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        password: hashedPassword,
      });

      // Send verification email
      const verificationToken = crypto.randomBytes(20).toString("hex");
      user.verificationToken = crypto
        .createHash("sha256")
        .update(verificationToken)
        .digest("hex");

      const verificationUrl = `${req.protocol}://${req.get(
        "host"
      )}/onboarding/${user.verificationToken}`;

      //Compose an email
      const html = `
        <div style="max-width: 700px; margin:auto; border: 10px solid #ddd; padding: 50px 20px; font-size: 110%;">
           <h2 style="text-align: center; text-transform: uppercase;color: teal;">Welcome to Eyi Media.</h2>
            <p>Congratulations! You're almost set to start using Eyi Media.
                Just click the button below to validate your account.
            </p>
             <a href="${verificationUrl}" style="background: teal; text-decoration: none; color: white; padding: 10px 20px; margin: 10px 0; display: inline-block;">Click here</a>
            </div>
        `;
      // Send email
      await mailer.sendEmail(
        fromUser,
        user.email,
        "Please verify your email!",
        html
      );

      await user.save();

      res.status(201).json({
        message:
          "Registration Successful! Please activate your email to start.",
        user,
        token: helperUtils.generateToken({ _id: user._id, email: user.email }),
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ msg: "Error sending verification email" });
    }
  }

  static async completeOnboard(req, res) {
    const { token } = req.params;
    const { bio, techStack, social } = req.body;
    const { github, linkedin, website, twitter, instagram, youtube } = social;

    const verificationToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    try {
      // Find user with specific verification token
      const user = await User.findOne({ verificationToken: token });
      if (!user) {
        return res.status(400).json({ msg: "Invalid or expired token" });
      }

      // Set user verified to true
      user.isVerified = true;
      user.verificationToken = undefined;
      if (req.file) user.profilePicUrl = req.file.path;

      await user.save();

      // Create profile
      let profileFields = {};
      profileFields.user = user._id;
      profileFields.bio = bio;
      profileFields.techStack = techStack;
      profileFields.badges = [];

      profileFields.social = {};
      if (github) profileFields.social.github = github;
      if (website) profileFields.social.website = website;
      if (linkedin) profileFields.social.linkedin = linkedin;
      if (twitter) profileFields.social.twitter = twitter;
      if (instagram) profileFields.social.instagram = instagram;
      if (youtube) profileFields.social.youtube = youtube;

      await new Profile(profileFields).save();

      // Initialise followers and following
      await new Follower({
        user: user._id,
        followers: [],
        following: [],
      }).save();

      // Initialise notifications
      await new Notification({ user: user._id, notifications: [] }).save();

      // Initialise chats
      await new Chat({ user: user._id, chats: [] }).save();

      res.status(200).json({
        msg: "User verified and onboarded",
        token: helperUtils.generateToken({ _id: user._id }),
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Server error" });
    }
  }

  static async signin(req, res) {
    const { email, password } = req.body;

    if (password.length < 6) {
      return res
        .status(400)
        .json({ msg: "Password must be atleast 6 characters long" });
    }

    try {
      const user = await User.findOne({ email: email.toLowerCase() }).select(
        "+password"
      );

      if (!user) {
        return res.status(400).json({ msg: "Invalid credentials" });
      }

      if (!user.isVerified) {
        return res
          .status(400)
          .json({ msg: "Please verify your email before trying to log in" });
      }

      // Check if password is correct
      const isCorrectPassword = helperUtils.comparePassword(
        password,
        user.password
      );

      if (!isCorrectPassword) {
        return res.status(400).json({ msg: "Invalid credentials" });
      }

      res.status(200).json({
        token: helperUtils.generateToken({ _id: user._id }),
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Server error" });
    }
  }

  static async getLoggedInUserInfo(req, res) {
    try {
      const user = await User.findById(req.id);

      if (!user) {
        return res.status(400).json({
          msg: "Please verify your email and complete onboarding first",
        });
      }
      res.status(200).json({ user });
    } catch (error) {
      console.error(err);
      res.status(500).json({ msg: "Server error" });
    }
  }

  static async updateUserInfo(req, res) {
    try {
      const { name, username } = req.body;

      // Check if username is already taken
      let user = await User.findOne({ username: username.toLowerCase() });

      if (user && user._id.toString() !== req.id) {
        return res.status(400).json({ msg: "Username is already taken" });
      }

      const updatedUser = {};
      if (name) updatedUser.name = name;
      if (username) updatedUser.username = username;
      if (req.file && req.file.path) updatedUser.profilePicUrl = req.file.path;

      user = await User.findByIdAndUpdate(req.id, updatedUser, {
        new: true,
      });

      res.status(200).json(user);
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Server error" });
    }
  }

  static async updatePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      const user = await User.findById(req.id).select("+password");
      if (!user) {
        return res.status(404).json({ msg: "User not found" });
      }

      // Check if current password matches
      const isMatch = helperUtils.comparePassword(
        currentPassword,
        user.password
      );
      if (!isMatch) {
        return res.status(401).json({ msg: "Incorrect password" });
      }

      if (newPassword.length < 6) {
        return res
          .status(400)
          .json({ msg: "Password must be atleast 6 characters long" });
      }

      user.password = helperUtils.hashPassword(newPassword);
      await user.save();

      res.status(200).json({ msg: "Password updated" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Server error" });
    }
  }

  static async forgotPassword(req, res) {
    try {
      const user = await User.findOne({ email: req.body.email });
      if (!user) {
        return res.status(404).json({ msg: "User not found" });
      }
      const resetToken = crypto.randomBytes(20).toString("hex");
      user.resetPasswordToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");
      user.resetPasswordExpire = Date.now() + 30 * 60 * 1000;

      const resetUrl = `${req.protocol}://${req.get("host")}/reset-password/${
        user.resetPasswordToken
      }`;
      //Compose an email
      const body = `Hi there,
    <p>Follow this <a href=${resetUrl}> link </a> to change your password. The link would expire in 30 mins.</p>`;

      // Send email
      await mailer.sendEmail(
        fromUser,
        user.email,
        "Please update your password!",
        body
      );

      await user.save();

      res.status(200).json({ msg: "Email sent" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Error sending verification email" });
    }
  }

  static async resetPassword(req, res) {
    const { token } = req.params;

    try {
      const user = await User.findOne({
        resetPasswordToken: token,
      });

      if (!user) {
        return res.status(400).json({ msg: "Invalid or expired token" });
      }

      // Set new password
      user.password = helperUtils.hashPassword(req.body.password);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      res.status(200).json({ msg: "Password reset complete" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Server error" });
    }
  }
}
