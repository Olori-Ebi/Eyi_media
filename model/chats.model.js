import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  chats: [
    {
      messagesWith: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      messages: [
        {
          message: {
            type: String,
            required: true,
          },
          sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          date: {
            type: Date,
          },
        },
      ],
    },
  ],
});

export default mongoose.model("Chat", chatSchema);
