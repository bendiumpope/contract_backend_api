const { Op, fn, col, literal } = require("sequelize");

const BaseRepository = require("./baseRepository");
const { Job, Contract, Profile } = require("../models");

class JobRepository extends BaseRepository {
  constructor() {
    super(Job);
  }

  async getUnpaidJobs(profileId) {
    return this.findAll({
      include: {
        model: Contract,
        where: {
          [Op.or]: [{ ContractorId: profileId }, { ClientId: profileId }],
          status: {
            [Op.ne]: "terminated",
          },
        },
      },
      where: {
        paid: null,
      },
    });
  }

  async findJob(jobId, transaction) {
    return Job.findOne({
      where: {
        id: jobId,
        paid: null,
      },
      include: {
        model: Contract,
        where: {
          status: {
            [Op.ne]: "terminated",
          },
        },
        include: [
          { model: Profile, as: "Client" },
          { model: Profile, as: "Contractor" },
        ],
      },
      transaction,
    });
  }
}

module.exports = JobRepository;
