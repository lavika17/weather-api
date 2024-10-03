document.addEventListener('DOMContentLoaded', function () {
    document.querySelector('#weatherForm').addEventListener('submit', function (e) {
        e.preventDefault(); // Prevent default form submission
        const cityName = document.querySelector('#CityInput').value; // Get city name input

        // Fetch weather data
        fetch(['http://localhost:3000/', 'https://weather-api-6vf9.vercel.app/'], {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({ cityName: cityName }) // Send city name
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.text(); // Return response text
        })
        .then(data => {
            const weatherResultDiv = document.getElementById('weatherResult'); // Select the div for displaying results
            weatherResultDiv.innerHTML = data; // Update only the weather result section
        })
        .catch(error => {
            console.error('Error fetching weather data:', error);
        });
    });
});
