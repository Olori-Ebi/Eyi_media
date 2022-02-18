import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();
const secretKey = process.env.MY_SECRET;
/**
 * @class HelperUtils
 * @description
 * @exports HelperUtils
 */
class helperUtils {
  /**
   * @method generateToken
   * @description
   * @returns token
   */
  static generateToken(payload) {
    const token = jwt.sign(payload, secretKey);
    return token;
  }

  /**
   * @method verifyToken
   * @description
   * @returns payload
   */
  static verifyToken(token) {
    try {
      const payload = jwt.verify(token, secretKey);
      return payload;
    } catch (error) {
      return false;
    }
  }

  /**
   * @method hashPassword
   * @description
   * @returns
   */
  static hashPassword(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
  }

  /**
   * @method verifyPassword
   * @description
   * @returns
   */
  static comparePassword(password, hashPassword) {
    return bcrypt.compareSync(password, hashPassword);
  }
}

export default helperUtils;
