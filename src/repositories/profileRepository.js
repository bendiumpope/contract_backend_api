const { Op, fn, col, literal } = require("sequelize");
const BaseRepository = require("./baseRepository");
const { Profile, Contract, Job } = require("../models");

class ProfileRepository extends BaseRepository {
  constructor() {
    super(Profile);
  }

  async getProfile(profileId) {
    return this.findOne({
      where: { id: profileId || 0 },
    });
  }

  async getTotalUnpaidJobs(clientId, transaction) {
    return Job.sum("price", {
      include: {
        model: Contract,
        where: {
          ClientId: clientId,
          status: "in_progress",
        },
      },
      where: {
        paid: null,
      },
      transaction: transaction,
    });
  }

  async getBestProfession(start, end) {
    return this.findOne({
      attributes: [
        "profession",
        [fn("SUM", col("Contractor.Jobs.price")), "total_earned"],
      ],
      include: [
        {
          model: Contract,
          as: "Contractor",
          attributes: [],
          include: {
            model: Job,
            attributes: [],
            where: {
              paid: true,
              paymentDate: {
                [Op.between]: [new Date(start), new Date(end)],
              },
            },
          },
        },
      ],
      where: {
        "$Contractor.Jobs.id$": {
          [Op.ne]: null,
        },
      },
      group: ["profession"],
      order: [[literal("total_earned"), "DESC"]],
      limit: 1,
      subQuery: false,
    });
  }

  async getBestClients(start, end, limit) {
    return this.findAll({
      attributes: [
        "id",
        [fn("concat", col("firstName"), " ", col("lastName")), "fullName"],
        [fn("SUM", col("Client.Jobs.price")), "total_spent"],
      ],
      include: [
        {
          model: Contract,
          as: "Client",
          attributes: [],
          required: true,
          include: [
            {
              model: Job,
              attributes: [],
              required: true,
              where: {
                paid: true,
                paymentDate: {
                  [Op.between]: [new Date(start), new Date(end)],
                },
              },
            },
          ],
        },
      ],
      group: ["Profile.id"],
      order: [[literal("total_spent"), "DESC"]],
      limit: parseInt(limit),
      subQuery: false,
    });
  }
}

module.exports = ProfileRepository;
