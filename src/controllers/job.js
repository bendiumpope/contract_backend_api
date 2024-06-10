const { Op, fn, col, literal } = require("sequelize");
const { sequelize } = require("../models");

const JobRepository = require("../repositories/jobRepository");

const jobRepo = new JobRepository();

const unpaidJobs = async (req, res) => {
  try {
    const unpaidJobs = await jobRepo.getUnpaidJobs(req.profile.id);

    if (unpaidJobs.length < 1) {
      return res.status(404).json({ error: "this profile have no unpaid Job" });
    }

    res.status(200).json({
      message: "success",
      data: unpaidJobs,
    });
  } catch (error) {
    throw error;
  }
};

const payContractor = async (req, res) => {
  const { job_id } = req.params;
  const t = await sequelize.transaction(); // Start a transaction

  try {
    // Find the job with associated contract and profiles
    const job = await jobRepo.findJob(job_id, t);

    if (!job) {
      await t.rollback();
      return res.status(404).json({ error: "Job not found or already paid" });
    }

    const contract = job.Contract;
    const client = contract.Client;
    const contractor = contract.Contractor;

    // Check if the requesting user is the client
    if (req.profile.id !== client.id) {
      await t.rollback();
      return res
        .status(403)
        .json({ error: "Only the client can pay for the job" });
    }

    // Check if the client have sufficient balance
    if (client.balance < job.price) {
      await t.rollback();
      return res.status(400).json({ error: "Insufficient balance" });
    }

    //update client and contractor balance
    client.balance = (client.balance - job.price).toFixed(2);
    contractor.balance = (contractor.balance + job.price).toFixed(2);

    job.paid = true;
    job.paymentDate = new Date();

    await client.save({ transaction: t });
    await contractor.save({ transaction: t });
    await job.save({ transaction: t });

    await t.commit();

    res.status(200).json({
      message: "Payment successful",
      data: job,
    });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  unpaidJobs,
  payContractor,
};
