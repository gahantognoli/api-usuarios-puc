class UserRepository {
  constructor(collection) {
    this.collection = collection;
  }

  async findOneByEmail(email) {
    const user = await this.collection.findOne({ email });
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  }

  async findById(id) {
    const user = await this.collection.findOne({ _id: id });
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  }

  async findAll() {
    return await this.collection.find({}).toArray();
  }

  async insert(user) {
    const result = await this.collection.insertOne(user);
    return { _id: result.insertedId, ...user };
  }

  async update(user) {
    const result = await this.collection.updateOne(
      { _id: user._id },
      { $set: { name: user.name, email: user.email } }
    );
    if (result.matchedCount === 0) {
      throw new Error("User not found");
    }
    return user;
  }

  async delete(userId) {
    const result = await this.collection.deleteOne({ _id: userId });
    if (result.deletedCount === 0) {
      throw new Error("User not found");
    }
    return;
  }
}

module.exports = UserRepository;
