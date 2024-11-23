import { Router } from "express";
import { authenticateToken } from "../utils/authenticateToken.js";
import {
  acceptRejectRequest,
  blockUser,
  deleteFriendRequest,
  getAllFriends,
  getAllRequests,
  postRequest,
} from "../controllers/friendController.js";
const friendRouter = Router();

friendRouter.get("/", authenticateToken, getAllFriends);
friendRouter
  .route("/request")
  .post(authenticateToken, postRequest)
  .get(authenticateToken, getAllRequests);

friendRouter.put("/request/:id", authenticateToken, acceptRejectRequest);
friendRouter.delete("/request/:id", authenticateToken, deleteFriendRequest);
friendRouter.put("/request/block/:id", authenticateToken, blockUser);

export { friendRouter };

/*
Send a Friend Request:

User A sends a request to User B using POST /friends/request.
View Pending Requests:

User B fetches their pending requests using GET /friends/requests.
Accept/Reject Request:

User B accepts or rejects the request with PUT /friends/requests/:id.
View Friends List:

Both users see each other in their friends list using GET /friends.
Remove Friend:

Either user can unfriend the other with DELETE /friends/:id.
Block/Unblock:

Either user can block/unblock the other using PUT /friends/block/:id or PUT /friends/unblock/:id.
Check Friendship Status:

A user can check their relationship with another user using GET /friends/status/:id.

*/
