const express = require('express');
const app = express();
const connectDB = require("./config/db");

connectDB();

app.use(express.json());

const PORT = process.env.PORT || 5000;

app.use("/api/users", require("./routes/api/users"));

app.use("/api/auth", require("./routes/api/auth"));

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));