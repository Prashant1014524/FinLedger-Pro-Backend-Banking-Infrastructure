require("dotenv").config()

const app = require("./src/app")   // adjust path if needed
const connectToDB = require("./src/config/db")

connectToDB()
console.log("ENV:", process.env.MONGO_URI)

app.listen(3000, () => {
    console.log("Server is running on port 3000")
})