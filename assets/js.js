const apiKey = "8d62924fd8eaa2c65c4ef4e4018b0fe2";
var userFormEl = $("#citySearch");

var buildSearchHistory = function() {
    // find search history from local storage
    var searchHistory = JSON.parse(localStorage.getItem("searchHistory"));
    if (searchHistory == null) {
        // if the search history does not exist then generate with given locations
        searchHistory = ["Nashville","Atlanta","Dallas","Denver","New York","Detroit","Seattle", "Ashville"];
        localStorage.setItem("searchHistory",JSON.stringify(searchHistory));
    }
    var groupContainer = $(".list-group");
    groupContainer.html("");
    for (i in searchHistory) {
        var buttonEl = $("<button>")
            .addClass("list-group-item list-group-item-action")
            .attr("id", "citySearchList")
            .attr("type", "button")
            .text(searchHistory[i]);
        groupContainer.append(buttonEl);
    }
};


var updateSearchHistory = function(city) {
    var searchHistory = JSON.parse(localStorage.getItem("searchHistory"));
    searchHistory.unshift(city);
    searchHistory.pop();
    localStorage.setItem("searchHistory",JSON.stringify(searchHistory));

    // gather list items
    var listItems = $(".list-group-item");

    // Update button text
    for (l in listItems) {
        listItems[l].textContent = searchHistory[l];
    };
}

var getIndex = function(response) {
    // takes the json response data from the api fetch and returns the index value. Changes every 3 hours.
    var idx = 0
    for (i=1;i<response.list.length;i++) {
        var currentTime = new Date(response.list[i].dt*1000);
        var lastTime = new Date(response.list[i-1].dt*1000);
        if (currentTime.getDay() != lastTime.getDay()) {
            if (i == 8) {
                idx = 0;
                return idx;
            } else {
                idx = i;
                return idx;
            };
        };
    };
};

var updateCurrentWeather = function(response) {
    // grab html elements
    var dateEl = $("#currentDate");
    var tempEl = $("#currentTemp");
    var humidityEl = $("#currentHumidity");
    var windSpeedEl = $("#currentWindSpeed");
    var iconEl = $("#currentIcon");

    // parse desired data from fetch response
    var currentTemp = response.main.temp;
    var currentHumidity = response.main.humidity;
    var currentWindSpeed = response.wind.speed;
    var currentTimeCodeUnix = response.dt;
    var currentDate = new Date(currentTimeCodeUnix*1000).toLocaleDateString("en-US");
    var currentIcon = response.weather[0].icon;
    
    // assign data to html
    dateEl.text(currentDate);
    tempEl.text(currentTemp);
    humidityEl.text(currentHumidity);
    windSpeedEl.text(currentWindSpeed);
    iconEl.attr("src", "https://openweathermap.org/img/w/" + currentIcon + ".png");

    // print data
    var currentTimeCodeUnix = response.dt;
    var s = new Date(currentTimeCodeUnix*1000).toLocaleDateString("en-US")

    // get UV Index
    var locationArr = {
        lat: response.coord.lat,
        long: response.coord.lon
    }
    
    return locationArr;
}; 

var updateUVIndex = function(val) {
    // style element according to UV index
    var uvEl = $("#currentUV");
    uvEl.text(val);
    uvEl.removeClass();

    if (val < 3) {
        uvEl.addClass("bg-success text-light p-2 rounded");
    } else if (val < 6) {
        uvEl.addClass("bg-warning text-light p-2 rounded");
    } else {
        uvEl.addClass("bg-danger text-light p-2 rounded");
    };
};

var getCurrentWeather = function(cityName) {
    
    var apiUrl = "https://api.openweathermap.org/data/2.5/weather?q=" + cityName + "&units=imperial&appid=" + apiKey;

    fetch(apiUrl).then(function(response) {
        // only continue if valid input for city name
        if (response.ok) {
            response.json().then(function(response) {
                var cityContainerEl = $("#currentCity");
                cityContainerEl.text(cityName);
                updateSearchHistory(cityName);

                var location = updateCurrentWeather(response);
                get5DayForecast(cityName);
                
                var apiUrlUV = "https://api.openweathermap.org/data/2.5/uvi?lat=" + location.lat  + "&lon=" + location.long + "&appid=" + apiKey;
                return fetch(apiUrlUV);
            }).then(function(response) {
                response.json().then(function(response) {
                    updateUVIndex(response.value);
                });
            });
        // if city name is invalid, give response
        } else {
            alert("City not found");
        };
    }).catch(function(error) {
        alert("Unable to connect to OpenWeather");
    })
};

var get5DayForecast = function(cityName) {
    var forecastContainerEl = $("#day-forecast");
    // clear existing data
    forecastContainerEl.html("");
    
    var apiUrl = "https://api.openweathermap.org/data/2.5/forecast?q=" + cityName + "&units=imperial&appid=" + apiKey;

    fetch(apiUrl).then(function(response) {
        response.json().then(function(response) {
            var idx = getIndex(response);
    
            for (i=0;i<5;i++) {
                var actualIdx = i * 8 + idx + 4;
                if (actualIdx>39) {actualIdx = 39};
    
                // retrieve data from and convert
                var timeCodeUnix = response.list[actualIdx].dt;
                var time = new Date(timeCodeUnix*1000).toLocaleDateString("en-US");
                var icon = response.list[actualIdx].weather[0].icon;
                var temp = response.list[actualIdx].main.temp;
                var humidity = response.list[actualIdx].main.humidity;
                var wind = response.list[actualIdx].wind.speed;
    
                var cardEl = $("<div>").addClass("col-2 card bg-primary pt-2");
                var cardTitleEl = $("<h5>").addClass("card-title").text(time);
                var divEl = $("<div>").addClass("weather-icon");
                var cardIconEl = $("<img>").addClass("p-2").attr("src","https://openweathermap.org/img/w/" + icon + ".png");
                var cardTempEl = $("<p>").addClass("card-text").text("Temp: " + temp + " " + String.fromCharCode(176) + "F");
                var cardHumidityEl = $("<p>").addClass("card-text mb-2").text("Humidity: " + humidity + "%");
                var cardWindEl = $("<p>").addClass("card-text").text("Wind Speed: " + wind + "mph");
    
                cardEl.append(cardTitleEl);
                divEl.append(cardIconEl);
                cardEl.append(divEl);
                cardEl.append(cardTempEl);
                cardEl.append(cardHumidityEl);
                cardEl.append(cardWindEl);
                forecastContainerEl.append(cardEl);
            }
        });
    }).catch(function(error) {
        alert("Unable to connect to OpenWeather");
    })
};

var formSubmitHandler = function(event) {
    target = $(event.target);
    targetId = target.attr("id");

    if (targetId === "citySearchList") {
        var city = target.text();
    } else if (targetId === "search-submit") {
        var city = $("#citySearch").val();
    };

    if (city) {
        getCurrentWeather(city);
    } else {
        alert("Please enter a city");
    }

    target.blur();
};

// Sets default search to build search history
buildSearchHistory();
getCurrentWeather("Nashville");


$("button").click(formSubmitHandler);

$('#citySearch').keypress(function(event){
    var keycode = (event.keyCode ? event.keyCode : event.which);
    if(keycode == '13'){
        var city = $("#citySearch").val();
        if (city) {
            getCurrentWeather(city);
        } else {
            alert("Please enter a city");
        }
    }
});