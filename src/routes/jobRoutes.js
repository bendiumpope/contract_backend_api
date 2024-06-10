const express = require("express");

const { getProfile } = require("../middleware/getProfile");
const { unpaidJobs, payContractor } = require("../controllers/job");

const router = express.Router();

router.post("/:job_id/pay", getProfile, payContractor);
router.get("/unpaid", getProfile, unpaidJobs);

module.exports = router;
