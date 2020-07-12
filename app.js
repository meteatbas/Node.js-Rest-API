const express=require('express');
const bodyParser=require('body-parser');

const feedRoutes=require('./routes/feed');

const app=express();

// app.use(bodyParser.urlencoded());//x-www-form-urlencoded <form>
app.use(bodyParser.json());//application/json

app.use((req,res,next)=>{
    res.setHeader('Access-Control-Allow-Origin','codepen.io','*');
    res.setHeader('Access-Control-Allow-Methods','GET,POST,PUT,DELETE,PATCH');
    res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization');
    next();
});

app.use('/feed',feedRoutes);//any request start with feed goes to feedRoute

app.listen(8080);

