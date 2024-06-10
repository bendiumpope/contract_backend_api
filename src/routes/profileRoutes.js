const express = require("express");
const { getProfile } = require("../middleware/getProfile");
const {
  userDeposit,
  bestContractorProfession,
  bestClients,
} = require("../controllers/profile");

const router = express.Router();

router.post("/deposit/:userId", getProfile, userDeposit);

router.get("/best-profession", getProfile, bestContractorProfession);

router.get("/best-clients", getProfile, bestClients);

module.exports = router;
