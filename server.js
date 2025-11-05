const express = require('express');
const cors = require('cors');
const knex = require('./lib/utils/database')
const {authRouter} = require("./routes/authRouter")

const app = express();
const port = 3001;

// gunakan middleware cors
app.use(cors({
  origin: '*', 
  credentials: true
}))

app.use(express.json());

// Router
app.use('/api/auth', authRouter)

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
