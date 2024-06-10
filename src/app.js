const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require("helmet");

const { profileRoutes, contractRoutes, jobRoutes } = require("./routes");
const limiter = require("./middleware/rateLimiter");
const { sequelize, Profile, Contract, Job } = require("./models");

const app = express();

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(helmet());
app.use("/api/v1", limiter);

app.set("sequelize", sequelize);
app.set("models", { Profile, Contract, Job });

app.use(cors());

app.use("/api/v1/balances", profileRoutes);
app.use("/api/v1/admin", profileRoutes);
app.use("/api/v1/contracts", contractRoutes);
app.use("/api/v1/jobs", jobRoutes);

module.exports = app;
