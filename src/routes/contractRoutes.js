const express = require("express");

const { getProfile } = require("../middleware/getProfile");
const { getContract, getContracts } = require("../controllers/contract");

const router = express.Router();

router.get("/:id", getProfile, getContract);
router.get("/", getProfile, getContracts);

module.exports = router;
