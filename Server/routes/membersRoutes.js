const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const membersController = require("../controllers/membersController");
// POST /api/members/join
router.post("/join", auth, membersController.joinClub);
// GET /api/members/profile
router.get("/profile", auth, membersController.getProfile);
// GET /api/members/referral-link
router.get("/referral-link", auth, membersController.getReferralLink);
// GET /api/members/admin/total-points-rewarded
// Admin-only stat — total points ever paid out across all members.
router.get("/admin/total-points-rewarded", auth, adminOnly, membersController.getTotalPointsRewarded);
// GET /api/members/admin/all
// Admin-only. Full list of club members with tier, points, and join date.
router.get("/admin/all", auth, adminOnly, membersController.getAllMembers);
router.get('/count', auth, membersController.getMemberCount);
module.exports = router;