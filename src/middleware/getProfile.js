const ProfileRepository = require("../repositories/profileRepository");

const profileRepo = new ProfileRepository();

const getProfile = async (req, res, next) => {
  const profile = await profileRepo.getProfile(req.get("profile_id"));

  if (!profile) return res.status(401).end();
  req.profile = profile;

  next();
};
module.exports = { getProfile };
