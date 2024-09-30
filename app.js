const {response} = require('express');
const express = require('express');
const https = require('https');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,'public')));
app.get('/' , (req , res)=>{
    res.sendFile(__dirname +"/index.html");
    
})
app.post('/',(req , res)=>{
    const querry = req.body.cityName
    const apiKey = '16ef0915f8a379f4de20cce10a5ee7e5'
    const url= 'https://api.openweathermap.org/data/2.5/weather?q='+ querry +'&appid='+apiKey+'&units=metric'
    https.get(url,(response)=>{
        //console.log(response);
        response.on('data',(data)=>{
            //console.log(data);
            const weatherData = JSON.parse(data);
            //console.log(weatherData);
            const temp = weatherData.main.temp;
            const discription = weatherData.weather[0].description
            //console.log(discription);
            res.write("<h1>The temperature in "+querry+" is " + temp + "degree celcius</h1>")
            res.write("<p>the weather discription is " + discription + "</p>" )
        })
    })
})


app.listen(3000 , ()=> console.log("our server is running at port 3000"))