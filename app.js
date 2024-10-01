// const {response} = require('express');
// const express = require('express');
// const https = require('https');
// const app = express();
// const path = require('path');
// const bodyParser = require('body-parser');

// app.use(bodyParser.urlencoded({extended:true}));
// app.use(express.static(path.join(__dirname,'public')));
// app.get('/' , (req , res)=>{
//     res.sendFile(__dirname +"/index.html");
    
// })
// app.post('/',(req , res)=>{
//     const querry = req.body.cityName
//     const apiKey = '16ef0915f8a379f4de20cce10a5ee7e5'
//     const url= 'https://api.openweathermap.org/data/2.5/weather?q='+ querry +'&appid='+apiKey+'&units=metric'
//     https.get(url,(response)=>{
//         //console.log(response);
//         response.on('data',(data)=>{
//             //console.log(data);
//             const weatherData = JSON.parse(data);
//             //console.log(weatherData);
//             const temp = weatherData.main.temp;
//             const discription = weatherData.weather[0].description
//             //console.log(discription);
//             res.write("<h1>The temperature in "+querry+" is " + temp + "degree celcius</h1>")
//             res.write("<p>the weather discription is " + discription + "</p>" )
//         })
//     })
// })


// app.listen(3000 , ()=> console.log("our server is running at port 3000"))



const express = require('express');
const https = require('https');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const app = express();

// Middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Set up session management
app.use(
  session({
    secret: 'mySecret', // Secret key for signing cookies
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60 * 60 * 1000 } // Session lasts 1 hour
  })
);

// Load users from a file (users.json)
const loadUsers = () => {
  if (fs.existsSync('users.json')) {
    return JSON.parse(fs.readFileSync('users.json', 'utf-8'));
  }
  return {};
};

// Save users to a file
const saveUsers = (users) => {
  fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
};

// Home route (weather form)
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Weather data fetch and display route
app.post('/', (req, res) => {
  const query = req.body.cityName;
  const apiKey = '16ef0915f8a379f4de20cce10a5ee7e5';
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${query}&appid=${apiKey}&units=metric`;

  https.get(url, (response) => {
    response.on('data', (data) => {
      const weatherData = JSON.parse(data);
      const temp = weatherData.main.temp;
      const description = weatherData.weather[0].description;

      res.write(`<h1>The temperature in ${query} is ${temp}°C</h1>`);
      res.write(`<p>The weather description is ${description}</p>`);
      
      // If logged in, allow saving weather
      if (req.session.isAuthenticated) {
        res.write('<form action="/save" method="POST"><button type="submit">Save Weather</button></form>');
      } else {
        res.write('<p>You must be logged in to save weather information.</p>');
      }
      res.send();
    });
  });
});

// User Registration Route
app.get('/register', (req, res) => {
  res.sendFile(__dirname + '/register.html');
});

app.post('/register', (req, res) => {
  const users = loadUsers();
  const { username, password } = req.body;

  if (users[username]) {
    res.send('User already exists. Try logging in.');
  } else {
    const hashedPassword = bcrypt.hashSync(password, 10); // Hash password
    users[username] = { password: hashedPassword };
    saveUsers(users);
    res.send('Registration successful. You can now log in.');
  }
});

// User Login Route
app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/login.html');
});

app.post('/login', (req, res) => {
  const users = loadUsers();
  const { username, password } = req.body;

  if (users[username] && bcrypt.compareSync(password, users[username].password)) {
    req.session.isAuthenticated = true;
    req.session.username = username;
    res.send('Login successful. <a href="/">Go to Home</a>');
  } else {
    res.send('Invalid credentials.');
  }
});

// Save Weather Route (only accessible to logged-in users)
app.post('/save', (req, res) => {
  if (req.session.isAuthenticated) {
    // Here you could store weather data in a file or memory
    res.send('Weather information saved.');
  } else {
    res.send('You must be logged in to save weather information.');
  }
});

// User Logout Route
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.send('Logged out. <a href="/">Go to Home</a>');
});

// Start the server
app.listen(3000, () => console.log('Server running on port 3000'));
