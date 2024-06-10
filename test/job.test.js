const request = require("supertest");
const app = require("../src/app");
const model = require("../src/models");

jest.mock("../src/models");

describe("Job Endpoints", () => {
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

  describe("GET /api/v1/jobs/unpaid", () => {
    it("should return all unpaid jobs for the profile", async () => {
      model.Profile.findOne.mockResolvedValue({
        id: 1,
        type: "client",
        balance: 100.0,
      });

      model.Job.findAll.mockResolvedValue([
        { id: 1, description: "Job 1", price: 100.0 },
        { id: 2, description: "Job 2", price: 200.0 },
      ]);

      const response = await request(app)
        .get("/api/v1/jobs/unpaid")
        .set("profile_id", 1);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: "success",
        data: [
          { id: 1, description: "Job 1", price: 100.0 },
          { id: 2, description: "Job 2", price: 200.0 },
        ],
      });
    });

    it("should return 404 if no unpaid jobs found", async () => {
      model.Profile.findOne.mockResolvedValue({
        id: 1,
        type: "client",
        balance: 100.0,
      });

      model.Job.findAll.mockResolvedValue([]);

      const response = await request(app)
        .get("/api/v1/jobs/unpaid")
        .set("profile_id", 1);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: "this profile have no unpaid Job",
      });
    });
  });

  describe("POST /api/v1/jobs/:job_id/pay", () => {
    it("should pay the contractor for the job", async () => {
      model.Profile.findOne.mockImplementationOnce(() =>
        Promise.resolve({
          id: 1,
          type: "client",
          balance: 100.0,
        })
      );

      model.Job.findOne.mockResolvedValue({
        id: 1,
        price: 50.0,
        paid: null,
        Contract: {
          Client: { id: 1, balance: 100.0, save: jest.fn() },
          Contractor: { id: 2, balance: 50.0, save: jest.fn() },
          status: "in_progress",
        },
        save: jest.fn(),
      });

      const response = await request(app)
        .post("/api/v1/jobs/1/pay")
        .set("profile_id", 1);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: "Payment successful",
        data: {
          id: 1,
          price: 50.0,
          paid: true,
          paymentDate: response.body.data.paymentDate,
          Contract: {
            Client: { id: 1, balance: "50.00" },
            Contractor: { id: 2, balance: "100.00" },
            status: "in_progress",
          },
        },
      });

      expect(mockCommit).toHaveBeenCalled();
      expect(mockRollback).not.toHaveBeenCalled();
    });

    it("should return 404 if job not found or already paid", async () => {
      model.Profile.findOne.mockImplementationOnce(() =>
        Promise.resolve({
          id: 1,
          type: "client",
          balance: 100.0,
        })
      );

      model.Job.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post("/api/v1/jobs/1/pay")
        .set("profile_id", 1);

      expect(response.status).toBe(404);
      expect(mockRollback).toHaveBeenCalled();
      expect(response.body).toEqual({
        error: "Job not found or already paid",
      });
    });

    it("should return 403 if the requesting user is not the client", async () => {
      model.Profile.findOne.mockImplementationOnce(() =>
        Promise.resolve({
          id: 1,
          type: "client",
          balance: 100.0,
        })
      );

      model.Job.findOne.mockResolvedValue({
        id: 1,
        price: 50.0,
        paid: null,
        Contract: {
          Client: { id: 2, balance: 100.0, save: jest.fn() },
          Contractor: { id: 2, balance: 50.0, save: jest.fn() },
          status: "in_progress",
        },
        save: jest.fn(),
      });

      const response = await request(app)
        .post("/api/v1/jobs/1/pay")
        .set("profile_id", 2);

      expect(response.status).toBe(403);
      expect(mockRollback).toHaveBeenCalled();
      expect(response.body).toEqual({
        error: "Only the client can pay for the job",
      });
    });

    it("should return 400 if client has insufficient balance", async () => {
      model.Profile.findOne.mockImplementationOnce(() =>
        Promise.resolve({
          id: 1,
          type: "client",
          balance: 100.0,
        })
      );

      model.Job.findOne.mockResolvedValue({
        id: 1,
        price: 50.0,
        paid: null,
        Contract: {
          Client: { id: 1, balance: 40.0, save: jest.fn() },
          Contractor: { id: 2, balance: 50.0, save: jest.fn() },
          status: "in_progress",
        },
        save: jest.fn(),
      });

      const response = await request(app)
        .post("/api/v1/jobs/1/pay")
        .set("profile_id", 1);

      expect(response.status).toBe(400);
      expect(mockRollback).toHaveBeenCalled();
      expect(response.body).toEqual({
        error: "Insufficient balance",
      });
    });
  });
});
