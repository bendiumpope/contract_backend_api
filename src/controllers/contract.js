const ContractRepository = require("../repositories/contractRepository");

const contractRepo = new ContractRepository();

/**
 * FIX ME!
 * @returns contract by id
 */
const getContract = async (req, res) => {
  const { id } = req.params;

  try {
    const contract = await contractRepo.findContract(id, req.profile.id);

    if (!contract) {
      return res.status(404).json({ error: "Contract not found" });
    }

    res.status(200).json({
      message: "success",
      data: contract,
    });
  } catch (error) {
    throw error;
  }
};

const getContracts = async (req, res) => {
  try {
    const contracts = await contractRepo.findContracts(req.profile.id);

    if (contracts.length < 1) {
      return res.status(404).json({ error: "Contract not found" });
    }

    res.status(200).json({
      message: "success",
      data: contracts,
    });
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getContract,
  getContracts,
};
