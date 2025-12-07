const express = require("express");
const bodyParser = require("body-parser");
const { MongoClient } = require("mongodb");
const UserRepository = require("./user-repository");
const { ObjectId } = require("mongodb");

const app = express();

app.use(bodyParser.json());

let userRepository;
let client;
let connected = false;

app.use(async (req, res, next) => {
  if (!connected) {
    const uri =
      "mongodb://root:root@localhost:27017?retryWrites=true&writeConcern=majority";
    client = new MongoClient(uri);
    await client.connect();
    const collection = client.db("users_db").collection("users");
    userRepository = new UserRepository(collection);
    connected = true;
  }

  next();
});

app.get("/users", async (req, res) => {
  const users = await userRepository.findAll();
  res.status(200).json(users);
});

app.get("/users/:id", async (req, res) => {
  try {
    const user = await userRepository.findById(new ObjectId(req.params.id));
    return res.status(200).json(user);
  } catch (error) {
    return res.status(404).json({ message: "User not found" });
  }
});

app.post("/users", async (req, res) => {
  const { name, email } = req.body;
  const newUser = await userRepository.insert({ name, email });
  res.status(201).json(newUser);
});

app.put("/users/:id", async (req, res) => {
  try {
    const { name, email } = req.body;
    const updatedUser = await userRepository.update({
      _id: new ObjectId(req.params.id),
      name,
      email,
    });
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(404).json({ message: "User not found" });
  }
});

app.delete("/users/:id", async (req, res) => {
  try {
    await userRepository.delete(new ObjectId(req.params.id));
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(404).json({ message: "User not found" });
  }
});

module.exports = app;
