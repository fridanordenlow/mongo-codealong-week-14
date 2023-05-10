import express from "express";
import cors from "cors";
import mongoose from "mongoose";

const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/books"; // not created in mongo db compass
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.Promise = Promise;

// Defines the port the app will run on. Defaults to 8080, but can be overridden
// when starting the server. Example command to overwrite PORT env variable value:
// PORT=9000 npm start
const port = process.env.PORT || 8080;
const app = express();

// Add middlewares to enable cors and json body parsing
app.use(cors());
app.use(express.json());

const Author = mongoose.model("Author", {
  name: String
})

const Book = mongoose.model("Book", {
  title: String,
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Author"
  }
})

// RESET_DATABASE could be named whatever we want
// run RESET_DATABASE=true npm run dev in terminal to invoke this
if (process.env.RESET_DATABASE) {
  console.log("Resetting database!")
  const seedDatabase = async () => {
    await Author.deleteMany()
    await Book.deleteMany()
  
    const tolkien = new Author({ name: "J.R.R. Tolkien"})
    await tolkien.save()
  
    const rowling = new Author({ name: "J.K. Rowling"})
    await rowling.save()

    // On each of these lines we generate a new book instance and we await it to be saved
    // We give each book a title but for the author we tell mongo that it is gonna use this other object (rowling/tolkien) as the author
    // And mongo will then say, okay but what is this other object's id? How do I relate to it? And it will then save this relationship for us.
    await new Book({ title: "Harry Potter and the Philosopher's Stone", author: rowling }).save()
    await new Book({ title: "Harry Potter and the Chamber of Secrets", author: rowling }).save()
    await new Book({ title: "Harry Potter and the Prisoner of Azkaban", author: rowling }).save()
    await new Book({ title: "The Lord of the Rings", author: tolkien }).save()
    await new Book({ title: "The Hobbit", author: tolkien }).save()
  }
  
  seedDatabase()
}

// Start defining your routes here
app.get("/", (req, res) => {
  res.send("Hello Technigo!");
});

app.get("/authors", async (req, res) => {
  const authors = await Author.find()
  res.json(authors)
})

app.get("/authors/:id", async (req, res) => {
  const author = await Author.findById(req.params.id)
  if (author) {
    res.json(author)
  } else {
    res.status(404).json({ error: "Author not found"})
  }
})

app.get("/authors/:id/books", async (req, res) => {
  const author = await Author.findById(req.params.id)
  const books = await Book.find({ author: mongoose.Types.ObjectId(author.id) })
  res.json(books)
})

app.get("/books", async (req, res) => {
  const books = await Book.find().populate("author")
  res.json(books)
})

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
