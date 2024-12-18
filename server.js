import { server } from "./app.js";
import "dotenv/config";
server.listen(process.env.PORT, () => console.log("listening on port 3000"));
