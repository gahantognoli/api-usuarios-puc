const { MongoClient } = require("mongodb");
const UserRepository = require("./user-repository");

describe("UserRepository", () => {
  let userRepository;
  let collection;
  let client;

  beforeAll(async () => {
    const uri =
      "mongodb://root:root@localhost:27017?retryWrites=true&writeConcern=majority";
    client = new MongoClient(uri);
    await client.connect();
    collection = client.db("users_db").collection("users");
    userRepository = new UserRepository(collection);
  });

  afterAll(async () => {
    await client?.close();
  });

  beforeEach(async () => {
    await collection.deleteMany({});
  });

  describe("findOneByEmail", () => {
    test("Deve retornar um usuário john@doe.com", async () => {
      const result = await collection.insertOne({
        name: "John Doe",
        email: "john@doe.com",
      });
      const user = await userRepository.findOneByEmail("john@doe.com");
      expect(user).toStrictEqual({
        _id: result.insertedId,
        name: "John Doe",
        email: "john@doe.com",
      });
    });

    test("Deve lançar um exceção para um usuário inexistente", async () => {
      await expect(
        userRepository.findOneByEmail("john@doe.com")
      ).rejects.toThrow();
    });
  });

  describe("insert", () => {
    test("Deve inserir um novo usuário", async () => {
      const user = { name: "Jane Doe", email: "jane@doe.com" };
      const insertedUser = await userRepository.insert(user);
      const foundUser = await collection.findOne({ _id: insertedUser._id });
      expect(foundUser).toStrictEqual(insertedUser);
    });
  });

  describe("update", () => {
    test("Deve atualizar um usuário existente", async () => {
      const user = { name: "Alice", email: "alice@email.com" };
      const result = await collection.insertOne(user);
      const updatedUser = {
        _id: result.insertedId,
        name: "Alice Smith",
        email: "alice@email.com",
      };
      await userRepository.update(updatedUser);
      const foundUser = await collection.findOne({ _id: result.insertedId });
      expect(foundUser).toStrictEqual(updatedUser);
    });

    test("Deve lançar uma exceção ao tentar atualizar um usuário inexistente", async () => {
      const nonExistentUser = {
        _id: "605c72ef2f1b2c6d88f8e8b4",
        name: "Bob",
        email: "bob@email.com",
      };
      await expect(userRepository.update(nonExistentUser)).rejects.toThrow();
    });
  });

  describe("delete", () => {
    test("Deve deletar um usuário existente", async () => {
      const user = { name: "Charlie", email: "charlie@email.com" };
      const result = await collection.insertOne(user);
      await userRepository.delete(result.insertedId);
      const foundUser = await collection.findOne({ _id: result.insertedId });
      expect(foundUser).toBeNull();
    });

    test("Deve lançar uma exceção ao tentar deletar um usuário inexistente", async () => {
      const nonExistentUserId = "605c72ef2f1b2c6d88f8e8b4";
      await expect(userRepository.delete(nonExistentUserId)).rejects.toThrow();
    });
  });

  describe("findAll", () => {
    test("Deve retornar uma lista de usuários", async () => {
      const users = [
        { name: "User One", email: "userone@email.com" },
        { name: "User Two", email: "usertwo@email.com" },
      ];
      await collection.insertMany(users);
      const foundUsers = await userRepository.findAll();
      expect(foundUsers).toHaveLength(users.length);
      users.forEach(user => {
        expect(foundUsers).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ name: user.name, email: user.email })
          ])
        );
      });
    });

    test("Deve retornar uma lista vazia quando não houver usuários", async () => {
      const foundUsers = await userRepository.findAll();
      expect(foundUsers).toHaveLength(0);
    });
  });
});
