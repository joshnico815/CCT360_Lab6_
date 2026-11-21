const API_URL =
    "https://api.weather.gc.ca/collections/citypageweather-realtime/items?f=json&bbox=-79.80,43.50,-79.50,43.70&limit=100&lang=en";

const refreshBtn = document.getElementById("refreshBtn");

// API Values

function getEnglishValue(data) {

    if (data === null || data === undefined) {
        return null;
    }

    if (typeof data !== "object") {
        return data;
    }

    if (data.value !== undefined) {
        return getEnglishValue(data.value);
    }

    return data.en ?? data.fr ?? null;
}

// Value Format

function displayValue(value, unit = "") {

    if (value === null || value === undefined || value === "") {
        return "--";
    }

    return value + unit;
}

// Update Current Date

function updateDate() {

    document.getElementById("currentDate").textContent =
        new Date().toLocaleDateString("en-CA", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });
}

// Use Mississauga Weather Records

function selectWeatherRecord(features) {

    const mississauga = features.find(feature => {

        const name = getEnglishValue(feature.properties?.name);

        return name?.toLowerCase() === "mississauga";

    });

    if (mississauga) return mississauga;

    // Locate available weather location
    const targetLat = 43.59;
    const targetLon = -79.66;

    return features.reduce((closest, feature) => {

        const coords = feature.geometry?.coordinates;

        if (!coords || coords.length < 2) return closest;

        const [lon, lat] = coords;

        const distance = Math.hypot(
            lat - targetLat,
            lon - targetLon
        );

        if (!closest) return feature;

        const closestCoords = closest.geometry?.coordinates;

        if (!closestCoords) return feature;

        const closestDistance = Math.hypot(
            closestCoords[1] - targetLat,
            closestCoords[0] - targetLon
        );

        return distance < closestDistance ? feature : closest;

    }, null);
}

// Weather Icons

function getWeatherIcon(condition) {

    const text = (condition || "").toLowerCase();

    if (/thunder|lightning/.test(text)) return "⛈️";

    if (/snow|flurr|blizzard|ice pellets/.test(text)) return "❄️";

    if (/rain|drizzle|shower/.test(text)) return "🌧️";

    if (/fog|mist/.test(text)) return "🌫️";

    if (/cloud|overcast/.test(text)) return "☁️";

    if (/sun|clear/.test(text)) return "☀️";

    return "🌤️";
}

// Update Background Theme Based on Weather Conditions

function updateTheme(condition) {

    const text = (condition || "").toLowerCase();

    const hero = document.querySelector(".hero");

    if (!hero) return;

    hero.classList.remove(
        "rainy",
        "snowy",
        "cloudy",
        "sunny"
    );

    if (/rain|drizzle|shower|thunder/.test(text)) {

        hero.classList.add("rainy");

    } else if (/snow|flurr|blizzard|ice pellets/.test(text)) {

        hero.classList.add("snowy");

    } else if (/cloud|overcast|fog/.test(text)) {

        hero.classList.add("cloudy");

    } else {

        hero.classList.add("sunny");

    }
}

// Update Current Weather Information

function updateCurrentWeather(properties) {

    const current = properties.currentConditions;

    if (!current) {
        throw new Error("Current conditions are missing.");
    }

    // Retrieve weather measurements
    const temperature =
        getEnglishValue(current.temperature);

    const humidity =
        getEnglishValue(current.relativeHumidity);

    const windSpeed =
        getEnglishValue(current.wind?.speed);

    const windDirection =
        getEnglishValue(current.wind?.direction);

    const pressure =
        getEnglishValue(current.pressure);

    const condition =
        getEnglishValue(current.condition);

    const windChill =
        getEnglishValue(current.windChill);

    const dewpoint =
        getEnglishValue(current.dewpoint);

    // Main temperature
    document.getElementById("temperature").textContent =
        displayValue(temperature);

    // Feels like 
    document.getElementById("feelsLike").textContent =
        displayValue(windChill ?? temperature);

    // Weather condition
    document.getElementById("condition").textContent =
        condition || "Conditions unavailable";

    // Weather icon
    document.getElementById("weatherIcon").textContent =
        getWeatherIcon(condition);

    // Weather summary
    document.getElementById("weatherSummary").textContent =
        condition
            ? "Current conditions in Mississauga: " + condition
            : "Weather information retrieved from Environment Canada.";

    // Wind speed
    document.getElementById("windSpeed").textContent =
        displayValue(windSpeed, " km/h");

    // Wind direction
    document.getElementById("windDirection").textContent =
        windDirection
            ? "Direction: " + windDirection
            : "Direction unavailable";

    // Humidity
    document.getElementById("humidity").textContent =
        displayValue(humidity, "%");

    // Atmospheric pressure
    document.getElementById("pressure").textContent =
        displayValue(pressure, " kPa");

    // Dew point
    document.getElementById("dewPoint").textContent =
        displayValue(dewpoint, "°C");

    // Update background
    updateTheme(condition);

    // Update weather insight
    updateWeatherInsight(condition);
}

// Insight

function updateWeatherInsight(condition) {

    const title =
        document.querySelector(".weather-message h3");

    const description =
        document.getElementById("insightText");

    const text = (condition || "").toLowerCase();

    if (!title || !description) return;

    if (/rain|drizzle|shower/.test(text)) {

        title.textContent = "Rain in the forecast";

        description.textContent =
            "Rain is currently being reported. Consider bringing an umbrella when going outside.";

    } else if (/snow|flurr|blizzard/.test(text)) {

        title.textContent = "Snowy conditions";

        description.textContent =
            "Snow is currently being reported. Check road conditions before travelling.";

    } else if (/sun|clear/.test(text)) {

        title.textContent = "Clear skies";

        description.textContent =
            "Clear conditions are currently being reported across the area.";

    } else if (/cloud|overcast/.test(text)) {

        title.textContent = "Cloudy conditions";

        description.textContent =
            "Cloud cover is currently being reported. Check the latest conditions before going outside.";

    } else {

        title.textContent = "Mississauga weather update";

        description.textContent =
            "Check the latest local weather conditions before planning your day.";

    }
}

// Fetch Weather Data from Environment Canada API

async function getWeather() {

    refreshBtn.textContent = "Updating...";

    refreshBtn.disabled = true;

    try {

        console.log("Connecting to Environment Canada...");

        const response = await fetch(API_URL);

        if (!response.ok) {

            throw new Error(
                "API request failed: " + response.status
            );

        }

        const data = await response.json();

        console.log("Full API response:", data);

        // Check weather records
        if (!data.features || data.features.length === 0) {

            throw new Error("No weather records found.");

        }

        // Select weather record
        const feature = selectWeatherRecord(data.features);

        if (!feature || !feature.properties) {

            throw new Error("Weather location not found.");

        }

        const properties = feature.properties;

        console.log("Selected location:", properties.name);

        console.log(
            "Current conditions:",
            properties.currentConditions
        );

        // Update current weather
        updateCurrentWeather(properties);

        // Update timestamp
        document.getElementById("lastUpdated").textContent =
            "Last checked: " +
            new Date().toLocaleTimeString();

    }

    catch (error) {

        console.error("Weather error:", error);

        document.getElementById("condition").textContent =
            "Weather unavailable";

        document.getElementById("weatherSummary").textContent =
            "Unable to retrieve weather information. Please refresh.";

    }

    finally {

        refreshBtn.textContent = "↻ Refresh";

        refreshBtn.disabled = false;

    }
}

// Refresh

refreshBtn.addEventListener("click", getWeather);

// Start webpage

updateDate();

getWeather();

// Auto Refresh Every 30 Minutes

setInterval(getWeather, 30 * 60 * 1000);
