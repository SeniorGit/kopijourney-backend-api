const express = require('express');
const cors = require('cors')
const app = express();

const port = 3001;
app.cors();
app.get('/', (req, res)=>{
    res.send('hello world');
});  

app.listen(port, ()=>{
    console.log(`Server listening to http://localhost:${port}`)
})