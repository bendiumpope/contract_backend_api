const { Op } = require("sequelize");
const BaseRepository = require("./baseRepository");
const { Contract } = require("../models");

class ContractRepository extends BaseRepository {
  constructor() {
    super(Contract);
  }

  async findContract(id, profileId) {
    return this.findOne({
      where: {
        id,
        [Op.or]: [{ ContractorId: profileId }, { ClientId: profileId }],
      },
    });
  }

  async findContracts(profileId) {
    return this.findAll({
      where: {
        [Op.or]: [{ ContractorId: profileId }, { ClientId: profileId }],
        status: {
          [Op.ne]: "terminated",
        },
      },
    });
  }
}

module.exports = ContractRepository;
