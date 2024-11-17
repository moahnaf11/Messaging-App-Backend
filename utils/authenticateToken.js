import jwt from "jsonwebtoken";

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "token not present" });
  } else {
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) return res.status(403).json({ error: "invalid token" }); // If token is invalid or expired
      req.user = user; // Attach user information to request
      console.log("validated token", user);
      return next();
    });
  }
}

export { authenticateToken };
