const express = require("express");
const bodyParser = require("body-parser");
const userRoute = require("./routes/userRoutes")
const categoryRoute = require('./routes/categoryRoutes')
const newsRoute = require('./routes/newsRoutes')
// const cors = require('cors')


const app = express()
require("dotenv").config();
require("./db")
const PORT = 3000;
app.use(express.json());
// app.use(cors({
//     origin: ["http://localhost:5173"]
// }))
app.use(bodyParser.json());
app.use('/users', userRoute);
app.use('/categories', categoryRoute)
app.use('/news', newsRoute)

app.get('/', (req, res)=>{
    res.send({
        message: "News api working"
    })
})
app.use(bodyParser.json());
app.listen(PORT, ()=>{
    console.log(`Server is running on port ${PORT}`)
})