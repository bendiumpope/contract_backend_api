const { sequelize } = require("../models");
const ProfileRepository = require("../repositories/profileRepository");

const profileRepo = new ProfileRepository();

const userDeposit = async (req, res) => {
  const { userId } = req.params;
  const { amount } = req.body;
  // Start a transaction
  const t = await sequelize.transaction();

  try {
    const client = await profileRepo.findOne({
      where: {
        id: userId,
        type: "client",
      },
      transaction: t,
    });

    if (!client) {
      await t.rollback();
      return res.status(404).json({ error: "Client not found" });
    }

    const totalUnpaidJobs = await profileRepo.getTotalUnpaidJobs(client.id, t);

    const maxDeposit = totalUnpaidJobs * 0.25;

    if (amount > maxDeposit) {
      await t.rollback();
      return res.status(400).json({
        error: `Deposit amount exceeds the allowed limit of ${maxDeposit.toFixed(
          2
        )}`,
      });
    }

    // Update the client's balance
    client.balance = (client.balance + amount).toFixed(2);
    await client.save({ transaction: t });

    await t.commit();

    res.status(201).json({
      message: "Deposit successful",
      data: { balance: client.balance },
    });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ error: "Internal server error" });
  }
};

const bestContractorProfession = async (req, res) => {
  const { start, end } = req.query;

  if (!start || !end) {
    return res.status(400).json({ error: "Start and end dates are required" });
  }

  try {
    const bestProfession = await profileRepo.getBestProfession(start, end);

    if (!bestProfession) {
      return res
        .status(404)
        .json({ error: "No profession found in the given date range" });
    }

    res.status(200).json({
      message: "success",
      data: {
        profession: bestProfession.profession,
        totalSumPaid: bestProfession.dataValues.total_earned,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

const bestClients = async (req, res) => {
  const { start, end, limit = 2 } = req.query;

  if (!start || !end) {
    return res.status(400).json({ error: "Start and end dates are required" });
  }

  try {
    const bestClients = await profileRepo.getBestClients(start, end, limit);

    if (!bestClients.length) {
      return res
        .status(404)
        .json({ error: "No clients found in the given date range" });
    }

    const formattedClients = bestClients.map((client) => ({
      id: client.dataValues.id,
      fullName: client.dataValues.fullName,
      paid: client.dataValues.total_spent,
    }));

    res.status(200).json({
      message: "success",
      data: formattedClients || bestClients,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  userDeposit,
  bestContractorProfession,
  bestClients,
};
