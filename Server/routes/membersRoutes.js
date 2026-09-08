const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const membersController = require("../controllers/membersController");
const { upload, getPublicUpdates, adminListUpdates, adminCreateUpdate, adminUpdateUpdate, adminDeleteUpdate, adminReorderUpdates } = require("../controllers/memberUpdatesController");
// POST /api/members/join
router.post("/join", auth, membersController.joinClub);
// GET /api/members/profile
router.get("/profile", auth, membersController.getProfile);
// GET /api/members/referral-link
router.get("/referral-link", auth, membersController.getReferralLink);
// GET /api/members/admin/total-points-rewarded
// Admin-only stat â€” total points ever paid out across all members.
router.get("/admin/total-points-rewarded", auth, adminOnly, membersController.getTotalPointsRewarded);
// GET /api/members/admin/all
// Admin-only. Full list of club members with tier, points, and join date.
router.get("/admin/all", auth, adminOnly, membersController.getAllMembers);
router.get('/count', auth, membersController.getMemberCount);
// GET /api/members/updates — public, active carousel items for MembersClub.tsx
router.get("/updates", getPublicUpdates);
// GET /api/members/admin/updates — all carousel items, for the admin panel
router.get("/admin/updates", auth, adminOnly, adminListUpdates);
// POST /api/members/admin/updates — upload a new carousel slide (multipart: file, title, subtitle)
router.post("/admin/updates", auth, adminOnly, upload.single("file"), adminCreateUpdate);
// PUT /api/members/admin/updates/reorder — bulk reorder carousel slides
router.put("/admin/updates/reorder", auth, adminOnly, adminReorderUpdates);
// PUT /api/members/admin/updates/:id — edit a carousel slide (optionally replace its media)
router.put("/admin/updates/:id", auth, adminOnly, upload.single("file"), adminUpdateUpdate);
// DELETE /api/members/admin/updates/:id — remove a carousel slide
router.delete("/admin/updates/:id", auth, adminOnly, adminDeleteUpdate);module.exports = router;