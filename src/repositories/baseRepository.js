class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async findAll(query) {
    return this.model.findAll(query);
  }

  async findOne(query) {
    return this.model.findOne(query);
  }

  async create(data) {
    return this.model.create(data);
  }

  async update(data, query) {
    return this.model.update(data, query);
  }

  async delete(query) {
    return this.model.destroy(query);
  }

  async sum(field, query) {
    return this.model.sum(field, query);
  }
}

module.exports = BaseRepository;
