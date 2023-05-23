// Map creation
let map;
let arrayID = []

// Map initialiser
function initMap() {
  var options = {
    zoom: 15,
    center: {
      lat: 51.5072,
      lng: -0.1276,
    },
  };
  map = new google.maps.Map(document.getElementById("map"), options);
}

function locationMarker(placeObj) {

  const myLatLng = placeObj.geometry.location;
  let address = placeObj.formatted_address;
  let name = placeObj.name

  // Used when a standard placeObj isn't parsed due to Geolocation.
  if (!name) {
    name = "Current location"
  }

  console.log(address)

  const marker = new google.maps.Marker({
    position: myLatLng,
    title: placeObj.name,
  });

  const contentInfo = `
    <div id="content">
        <h3>${name}</h3>
        <p>${address}</p>
    </div>
    `;
  const infoWindow = new google.maps.InfoWindow({
    content: contentInfo,
    ariaLabel: name,
  });

  marker.setMap(map);

  marker.addListener("click", () => {
    infoWindow.open({
      anchor: marker,
      map,
    });
  });
}


function locationFinder(location, tags) {
  var apiURL = `https://maps.googleapis.com/maps/api/geocode/json?&address=${location}&key=${keyAPI}`
  console.log(apiURL)
  fetch(apiURL)
      .then(response => response.json())
      .then(data => {

        if (data.status !== "OK") {
          invalidPara.innerHTML = `The error message ${data.status} has occured, please enter a valid location/cusine and try again`;
            return;
        } else {
            const placeObj = data.results[0]
            const location = data.results[0].geometry.location
            console.log(placeObj)
            locationMarker(placeObj)
            map.panTo(location);
            nearbyPlaces(location, tags)
        }})
}

function nearbyPlaces(input, tags) {
  const lat = input.lat;
  const lng = input.lng;
  var keywords = tags;

  var apiURL = `https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${input.lat}%2C${input.lng}&radius=1500&keyword=${keywords}&key=${keyAPI}`;
  console.log(apiURL);
  fetch(apiURL)
    .then((response) => response.json())
    .then((data) => {
      renderData(data);
    });
}

async function fetchDetails(arrayID) {

  const requests = [];

  try {
    for (let i = 0; i < arrayID.length; i++) {
      const apiURL = `https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/details/json?&place_id=${arrayID[i]}&fields=geometry,name,formatted_address,type,rating,price_level,website,photo,reviews,opening_hours&key=${keyAPI}`
    
      requests.push(
        new Promise((resolve, reject) => {
          fetch(apiURL)
            .then((response) => response.json())
            .then((data) => {
              resolve(data)
            })
        })
      )
    }
    const result = await Promise.all(requests);

    const responseArray = result.flatMap((page) => page)
    return responseArray;
    
  } catch {
      throw Error("Failed to load API, please refresh and try again.")
  }
}

// Query Selector for the results tab.

const resultsElement = document.getElementById("results");

async function renderData(locationObject) {
    // Clears previous cards if there are any.
    resultsElement.innerHTML = ""

    console.log(locationObject)

    const arrayID = []

    const slicedResults = locationObject.results.slice(0, 9)

    for (let i = 0; i < slicedResults.length; i++) {
        let placeID = slicedResults[i].place_id
        arrayID.push(placeID)
    }

    fetchDetails(arrayID)
        .then(data => {
            // Local places infomation.
            const results = data
            console.log(results)

            for (x = 0; x < results.length; x++) {
              const resultObj = results[x].result
              // console.log(resultObj)
              locationMarker(resultObj)

              const cardContent =

              `
              <h3>${results[x].result.name}</h3>
              <p></p>

                


              `
            
              let newResult = document.createElement('article')
              newResult.classList.add('result-card')
              newResult.innerHTML = cardContent
      
              resultsElement.appendChild(newResult)    

            }
        })

    console.log(resultsElement)
}

// fUNCTION working on local storage
const storedResults = JSON.parse(localStorage.getItem('recentResults'));

if (storedResults != null) {
  arrayID.push(...storedResults)
}

function saveRecentResults(location) {

    const locationValue = locationElement.value
    const index = searchedLocations.indexOf(location)

    if (index === -1) {
      arrayID.push(location);

      localStorage.setItem('recentResults' , JSON.stringify(arrayID));
    }

}

// Query Selectors
const locationElement = document.querySelector("#location");
const keywordsElement = document.querySelector("#cuisine");
const invalidPara = document.querySelector("#error-msg");

function locationGet(event) {
    event.preventDefault()
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((data) => {
            console.log(data)
            locationElement.value = `${data.coords.latitude} ${data.coords.longitude}`
        })
    } else {

    }
}

function locationSearch(event) {
  event.preventDefault();
  var location = locationElement.value;
  var tags = keywordsElement.value;
  console.log(tags);
  if (!location || !tags) {
    invalidPara.innerHTML = "Please enter a location or search term!";
    setTimeout(() => {
      invalidPara.innerHTML = "";
    }, 3000);
  } else {
    locationFinder(location, tags);
  }
}

window.initMap = initMap;