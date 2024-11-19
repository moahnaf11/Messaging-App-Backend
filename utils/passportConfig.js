import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import { getUser } from "../prisma/userQueries.js";

// Define the Local Strategy
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      // Find the user in the database
      const user = await getUser(username);
      if (!user) {
        return done(null, false, { message: "Invalid username" });
      }

      // Compare passwords
      const match = await bcrypt.compare(password, user.password);

      if (!match) {
        return done(null, false, { message: "Invalid password" });
      }

      // Authentication successful
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  })
);

export { passport };


// const authenticateJWT = (req, res, next) => {
//   const token = req.headers.authorization?.split(" ")[1];

//   if (!token) {
//     return res.status(401).json({ error: "Access denied" });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded; // Attach user data to request
//     next();
//   } catch (err) {
//     res.status(403).json({ error: "Invalid token" });
//   }
// };
