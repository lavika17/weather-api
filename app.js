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
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Weather data fetch and display route
app.post('/', (req, res) => {
  const query = req.body.cityName;
  const apiKey = '16ef0915f8a379f4de20cce10a5ee7e5';
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${query}&appid=${apiKey}&units=metric`;

  https.get(url, (response) => {
    let weatherData = '';

    // Collect data chunks
    response.on('data', (chunk) => {
      weatherData += chunk;
    });

    // When all data is received
    response.on('end', () => {
      const parsedData = JSON.parse(weatherData);

      if (parsedData.cod !== 200) {
        return res.send('<h1>City not found. Please try again.</h1><a href="/">Go Back</a>');
      }

      const temp = parsedData.main.temp;
      const description = parsedData.weather[0].description;

      // Construct the full HTML response
      let weatherHtml = `
        <h1>The temperature in ${query} is ${temp}°C</h1>
        <p>The weather description is: ${description}</p>
      `;

      if (req.session.isAuthenticated) {
        weatherHtml += `<form action="/save" method="POST"><button type="submit">Save Weather</button></form>`;
      } else {
        weatherHtml += `<p>You must be logged in to save weather information.</p>`;
      }

      // Set Content-Type header to text/html
      res.setHeader('Content-Type', 'text/html');
      
      // Send the constructed HTML response to the client
      res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Weather Result</title>
          <link rel="stylesheet" href="/styles/styles.css"> <!-- Link to your stylesheet -->
        </head>
        <body>
          ${weatherHtml}
          <a href="/">Go Back</a> <!-- Add a link to go back to the homepage -->
        </body>
        </html>
      `);
    });
  }).on('error', (err) => {
    res.setHeader('Content-Type', 'text/html');
    res.send('<h1>Error fetching weather data. Please try again.</h1>');
  });
});

// User Registration Route
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// User Registration POST
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
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// User Login POST
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
