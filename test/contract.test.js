const request = require("supertest");
const app = require("../src/app");
const model = require("../src/models");

jest.mock("../src/models");

describe("Contract Endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe("GET /api/v1/contracts/:id", () => {
    it("should return contract by id", async () => {
      model.Profile.findOne.mockImplementationOnce(() =>
        Promise.resolve({
          id: 1,
          type: "client",
          balance: 100.0,
        })
      );

      model.Contract.findOne.mockResolvedValue({
        id: 1,
        terms: "Some terms",
        status: "active",
      });

      const response = await request(app)
        .get("/api/v1/contracts/1")
        .set("profile_id", 1);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: "success",
        data: {
          id: 1,
          terms: "Some terms",
          status: "active",
        },
      });
    });

    it("should return 404 if contract not found", async () => {
      model.Profile.findOne.mockImplementationOnce(() =>
        Promise.resolve({
          id: 1,
          type: "client",
          balance: 100.0,
        })
      );

      model.Contract.findOne.mockResolvedValue(null);

      const response = await request(app)
        .get("/api/v1/contracts/1")
        .set("profile_id", 1);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: "Contract not found" });
    });
  });

  describe("GET /api/v1/contracts", () => {
    it("should return all active contracts for the profile", async () => {
      model.Profile.findOne.mockResolvedValue({
        id: 1,
        type: "client",
        balance: 100.0,
      });

      model.Contract.findAll.mockResolvedValue([
        { id: 1, terms: "Terms 1", status: "active" },
        { id: 2, terms: "Terms 2", status: "active" },
      ]);

      const response = await request(app)
        .get("/api/v1/contracts")
        .set("profile_id", 1);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: "success",
        data: [
          { id: 1, terms: "Terms 1", status: "active" },
          { id: 2, terms: "Terms 2", status: "active" },
        ],
      });
    });

    it("should return 404 if no active contracts found", async () => {
      model.Profile.findOne.mockResolvedValue({
        id: 1,
        type: "client",
        balance: 100.0,
      });

      model.Contract.findAll.mockResolvedValue([]);

      const response = await request(app)
        .get("/api/v1/contracts")
        .set("profile_id", 1);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: "Contract not found" });
    });
  });
});
