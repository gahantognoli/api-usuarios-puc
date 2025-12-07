const app = require("./app");
const request = require("supertest");
const { MongoClient } = require("mongodb");
const UserRepository = require("./user-repository");

describe("UserApi", () => {
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

  describe("/users", () => {
    describe("GET", () => {
      test("Deve listar uma lista vazia de usuários", async () => {
        const response = await request(app).get("/users");
        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual([]);
      });

      test("Deve listar uma lista com usuários", async () => {
        await userRepository.insert({
          name: "John Doe",
          email: "john@doe.com",
        });
        await userRepository.insert({
          name: "Jane Doe",
          email: "jane@doe.com.br",
        });

        const response = await request(app).get("/users");
        expect(response.status).toBe(200);
        expect(response.body[0]).toEqual(
          expect.objectContaining({
            name: "John Doe",
            email: "john@doe.com",
          })
        );
        expect(response.body[1]).toEqual(
          expect.objectContaining({
            name: "Jane Doe",
            email: "jane@doe.com.br",
          })
        );
      });
    });

    describe("POST", () => {
      test("Deve criar um novo usuário com dados válidos", async () => {
        const newUser = {
          name: "Alice",
          email: "alice@email.com",
        };
        const response = await request(app).post("/users").send(newUser);
        expect(response.status).toBe(201);
        expect(response.body).toEqual(
          expect.objectContaining({
            name: "Alice",
            email: "alice@email.com",
          })
        );
      });
    });
  });

  describe("/users/:id", () => {
    describe("GET", () => {
      test("Deve retornar os dados do usuário existente", async () => {
        const insertedUser = await userRepository.insert({
          name: "Bob",
          email: "bob@email.com",
        });
        const response = await request(app).get(`/users/${insertedUser._id}`);
        expect(response.status).toBe(200);
        expect(response.body).toEqual(
          expect.objectContaining({
            name: "Bob",
            email: "bob@email.com",
          })
        );
      });

      test("Deve retornar 404 para usuário inexistente", async () => {
        const response = await request(app).get(
          `/users/64b64c4f5311236168a109ca`
        );
        expect(response.status).toBe(404);
        expect(response.body).toEqual(
          expect.objectContaining({
            message: "User not found",
          })
        );
      });
    });

    describe("PUT", () => {
      test("Deve atualizar os dados do usuário existente", async () => {
        const insertedUser = await userRepository.insert({
          name: "Charlie",
          email: "charlie@email.com",
        });
        const updatedData = {
          name: "Charles",
          email: "charles@email.com",
        };
        const response = await request(app)
          .put(`/users/${insertedUser._id}`)
          .send(updatedData);
        expect(response.status).toBe(200);
        expect(response.body).toEqual(
          expect.objectContaining({
            _id: insertedUser._id.toString(),
            email: "charles@email.com",
            name: "Charles",
          })
        );
      });

      test("Deve retornar 404 ao tentar atualizar usuário inexistente", async () => {
        const response = await request(app)
          .put(`/users/64b64c4f5311236168a109ca`)
          .send({
            name: "Nonexistent User",
            email: "nonexistent@email.com",
          });
        expect(response.status).toBe(404);
        expect(response.body).toEqual(
          expect.objectContaining({
            message: "User not found",
          })
        );
      });
    });

    describe("DELETE", () => {
      test("Deve deletar o usuário existente", async () => {
        const insertedUser = await userRepository.insert({
          name: "Dave",
          email: "dave@email.com",
        });
        const response = await request(app).delete(
          `/users/${insertedUser._id}`
        );
        expect(response.status).toBe(200);
      });

      test("Deve retornar 404 ao tentar deletar usuário inexistente", async () => {
        const response = await request(app).delete(
          `/users/64b64c4f5311236168a109ca`
        );
        expect(response.status).toBe(404);
        expect(response.body).toEqual(
          expect.objectContaining({
            message: "User not found",
          })
        );
      });
    });
  });
});
