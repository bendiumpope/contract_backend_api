const request = require("supertest");
const app = require("../src/app");
const model = require("../src/models");

jest.mock("../src/models");

describe("Profile Endpoints", () => {
  let mockTransaction;
  let mockCommit;
  let mockRollback;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCommit = jest.fn();
    mockRollback = jest.fn();

    mockTransaction = {
      commit: mockCommit,
      rollback: mockRollback,
    };

    model.sequelize.transaction = jest.fn(() =>
      Promise.resolve(mockTransaction)
    );
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });
  describe("POST /api/v1/balances/deposit/:userId", () => {
    it("should deposit money into client's account", async () => {
      model.Profile.findOne.mockImplementationOnce(() =>
        Promise.resolve({
          id: 1,
          type: "client",
          balance: 100.0,
        })
      );

      model.Profile.findOne.mockResolvedValue({
        id: 1,
        type: "client",
        balance: 100.0,
        save: jest.fn().mockResolvedValue(true),
      });

      model.Job.sum.mockResolvedValue(400.0);

      const response = await request(app)
        .post("/api/v1/balances/deposit/1")
        .send({ amount: 50.0 })
        .set("profile_id", 1);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        message: "Deposit successful",
        data: { balance: "150.00" },
      });
    });

    it("should return 404 if client not found", async () => {
      model.Profile.findOne.mockImplementationOnce(() =>
        Promise.resolve({
          id: 1,
          type: "client",
          balance: 100.0,
        })
      );

      model.Profile.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post("/api/v1/balances/deposit/1")
        .send({ amount: 50.0 })
        .set("profile_id", 1);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: "Client not found" });
    });

    it("should return 400 if deposit amount exceeds allowed limit", async () => {
      model.Profile.findOne.mockResolvedValue({
        id: 1,
        type: "client",
        balance: 100.0,
      });

      model.Profile.findOne.mockResolvedValue({
        id: 1,
        type: "client",
        balance: 100.0,
        save: jest.fn().mockResolvedValue(true),
      });

      model.Job.sum.mockResolvedValue(400.0);

      const response = await request(app)
        .post("/api/v1/balances/deposit/1")
        .send({ amount: 500.0 })
        .set("profile_id", 1);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: "Deposit amount exceeds the allowed limit of 100.00",
      });
    });
  });

  describe("GET /api/v1/admin/best-profession", () => {
    it("should return the best contractor profession", async () => {
      model.Profile.findOne.mockImplementationOnce(() =>
        Promise.resolve({
          id: 1,
          type: "client",
          balance: 100.0,
        })
      );
      model.Profile.findOne.mockResolvedValue({
        profession: "Software Engineer",
        dataValues: { total_earned: 5000.0 },
      });

      const response = await request(app)
        .get("/api/v1/admin/best-profession?start=2023-01-01&end=2023-12-31")
        .set("profile_id", 1);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: "success",
        data: {
          profession: "Software Engineer",
          totalSumPaid: 5000.0,
        },
      });
    });

    it("should return 404 if no profession found", async () => {
      model.Profile.findOne.mockImplementationOnce(() =>
        Promise.resolve({
          id: 1,
          type: "client",
          balance: 100.0,
        })
      );
      model.Profile.findOne.mockResolvedValue(null);

      const response = await request(app)
        .get("/api/v1/admin/best-profession?start=2023-01-01&end=2023-12-31")
        .set("profile_id", 1);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: "No profession found in the given date range",
      });
    });

    it("should return 400 if start and end dates are not provided", async () => {
      model.Profile.findOne.mockImplementationOnce(() =>
        Promise.resolve({
          id: 1,
          type: "client",
          balance: 100.0,
        })
      );

      const response = await request(app)
        .get("/api/v1/admin/best-profession")
        .set("profile_id", 1);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: "Start and end dates are required",
      });
    });

    it("should return 500 if there is an internal server error", async () => {
      model.Profile.findOne.mockImplementationOnce(() =>
        Promise.resolve({
          id: 1,
          type: "client",
          balance: 100.0,
        })
      );
      model.Profile.findOne.mockRejectedValue(new Error("Internal error"));

      const response = await request(app)
        .get("/api/v1/admin/best-profession?start=2023-01-01&end=2023-12-31")
        .set("profile_id", 1);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: "Internal server error" });
    });
  });

  describe("GET /api/v1/admin/best-clients", () => {
    it("should return the best clients", async () => {
      model.Profile.findOne.mockImplementationOnce(() =>
        Promise.resolve({
          id: 1,
          type: "client",
          balance: 100.0,
        })
      );
      model.Profile.findAll.mockResolvedValue([
        {
          dataValues: { id: 1, fullName: "John Doe", total_spent: 3000.0 },
        },
        {
          dataValues: { id: 2, fullName: "Jane Smith", total_spent: 2500.0 },
        },
      ]);

      const response = await request(app)
        .get("/api/v1/admin/best-clients?start=2023-01-01&end=2023-12-31")
        .set("profile_id", 1);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: "success",
        data: [
          { id: 1, fullName: "John Doe", paid: 3000.0 },
          { id: 2, fullName: "Jane Smith", paid: 2500.0 },
        ],
      });
    });

    it("should return 404 if no clients found", async () => {
      model.Profile.findOne.mockImplementationOnce(() =>
        Promise.resolve({
          id: 1,
          type: "client",
          balance: 100.0,
        })
      );
      model.Profile.findAll.mockResolvedValue([]);

      const response = await request(app)
        .get("/api/v1/admin/best-clients?start=2023-01-01&end=2023-12-31")
        .set("profile_id", 1);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: "No clients found in the given date range",
      });
    });

    it("should return 400 if start and end dates are not provided", async () => {
      model.Profile.findOne.mockImplementationOnce(() =>
        Promise.resolve({
          id: 1,
          type: "client",
          balance: 100.0,
        })
      );

      const response = await request(app)
        .get("/api/v1/admin/best-clients")
        .set("profile_id", 1);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: "Start and end dates are required",
      });
    });

    it("should return 500 if there is an internal server error", async () => {
      model.Profile.findOne.mockImplementationOnce(() =>
        Promise.resolve({
          id: 1,
          type: "client",
          balance: 100.0,
        })
      );
      model.Profile.findAll.mockRejectedValue(new Error("Internal error"));

      const response = await request(app)
        .get("/api/v1/admin/best-clients?start=2023-01-01&end=2023-12-31")
        .set("profile_id", 1);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: "Internal server error" });
    });
  });
});
