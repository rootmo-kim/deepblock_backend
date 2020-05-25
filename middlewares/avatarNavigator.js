const crypto = require("crypto");
const hash = require('../config/configs').hash;
const salt = require('../config/configs').salt;
const profile_dir_name = require('../config/configs').profiles;
const base_path = require('../config/configs').base_path;

const profilenavigator = (req, res, next) => {
  const hashId = crypto.createHash(hash).update(req.session.username + salt).digest("hex");
  req.user_path = `${base_path}/${hashId}/${profile_dir_name}/`;
  req.profile_name = req.session.username;

  next();
}

module.exports = profilenavigator;