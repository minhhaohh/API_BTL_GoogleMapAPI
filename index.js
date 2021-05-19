var p = null;
var list1 = []; // places
var list2 = []; // markers
var list3 = []; // inforwindows
var map = null;
var radius = 500;
var type = ['cafe'];
var mypos = {};
var pos = {};
var service = null;
var markers = [];
var mode;

function initMap() {
   map = new google.maps.Map(document.getElementById("map"), {
     zoom: 17,
   });

   service = new google.maps.places.PlacesService(map); // PlacesService để tìm kiếm địa điểm

   getCurrentLocation(); // vị trí hiện tại
   showPlaces(); // because we use local storage so we can read data from it
   initSearchBox();

    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer();

    directionsRenderer.setMap(map);

    document.getElementById("showdirection").addEventListener("click", () => {
      calculateAndDisplayRoute(directionsService, directionsRenderer);
    })

}

function getCurrentLocation(){
  if (navigator.geolocation) { // set current location to map
      navigator.geolocation.getCurrentPosition(
        (position) => { //  current location

          mypos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          map.setCenter(pos);
          new google.maps.Marker({map, position: pos});
          getNearby();
          weatherBalloon( pos );
        },

        () => { // 
          alert("Location not found");
          location.reload();
        }

      );

    } else {
      // Browser doesn't support Geolocation
      //handleLocationError(false, infoWindow, map.getCenter());
    }
}

function getNearby(){
  // nearbySearch
  service.nearbySearch(
    
    { location: pos, radius: radius, type: type },

    (results, status, pagination) => {
       if (status !== "OK" || !results) return;
       getDetails(results); // after have results

    }
  );
  //end nearbySearch
}

function getDetails(results){
  let count = results.length;
   // getPlace
      results.forEach(element =>{
          let location = element.geometry.location;
          let icon = element.icon;
          let name = element.name;
          let place_id = element.place_id;
          let rating = (element.rating) ? element.rating : null;
          let reviews = null;

          let request = {
            placeId: place_id,
            fields: ["name", "reviews", "geometry", "type", "icon", "formatted_address"],
          };
          service.getDetails(request, (place, status) => {
                p = {
                  location,
                  icon:{
                    url: element.icon,
                    size: new google.maps.Size(90, 90),
                    origin: new google.maps.Point(0, 0),
                    anchor: new google.maps.Point(17, 34),
                    scaledSize: new google.maps.Size(25, 25),
                  },
                  name,
                  place_id,
                  rating,
                  reviews: null,
                  type: type,
                  formatted_address: null
                };

                if (place && place.reviews) {
                  p.reviews = place.reviews;
                }

                if (place && place.formatted_address) {
                  p.formatted_address = place.formatted_address;
                }

                list1.push(p);

                if(list1.length == count){ // if gone through all result to get reviews
                  createMarkerAndAddEvent();
                }
          });
          
      })
}

function createMarkerAndAddEvent(){

  // each place => each marker
  list1.forEach( function(place, index) {
    list2.push(new google.maps.Marker({
      map,
      icon: place.icon,
      position: place.location
    }));
  });

  // each marker => each inforWindow
  list2.forEach((item, index) =>{
    let contentString = "<h3>" + list1[index].name + "</h3>";
      contentString += "<h4> Address: " + ((list1[index].formatted_address) ? list1[index].formatted_address : "None address") + "</h4>";
      contentString += "<h4> Rating: " + ((list1[index].rating) ? (list1[index].rating + "<img src='star.png'/> ") : "None rating") + "</h4>";
      contentString += "<h4> Reviews:</h4>";
      if(list1[index].reviews){
        for(let i = 0; i < list1[index].reviews.length; i++){
          contentString += "<p> <strong>" + list1[index].reviews[i].author_name + "</strong>: ";
          contentString += list1[index].reviews[i].text + "</p>";
        }
      }else{
        contentString += "None reviews";
      }

      contentString += "</br><button class='btn btn-dark' id='btnAdd" + index + "'>Add to List</button>";

      list3.push(new google.maps.InfoWindow({
        content: contentString,
      }));
  });

  // add event to marker
  list2.forEach((markerItem, index) =>{

    markerItem.addListener("click", ()=>{
      list3.forEach((infoWindowItem, index) =>{
        infoWindowItem.close();
      });   

      list3[index].open(map, markerItem);

      //add event to btnAdd
      var btnAdd = document.getElementById("btnAdd" + index);
      btnAdd.onclick = (event)=>{
        let name = list1[index].name; //getting place name
        let location = list1[index].location; //getting place location
        let getLocalStorageDataName = localStorage.getItem("Name"); //getting localstorage
        let getLocalStorageDataLocation = localStorage.getItem("Location"); //getting localstorage
        if(getLocalStorageDataName == null){ //if localstorage has no data
          listArrayName = []; //create a blank array
          listArrayLocation = []; //create a blank array
        }else{
          listArrayName = JSON.parse(getLocalStorageDataName);  //transforming json string into a js object
          listArrayLocation = JSON.parse(getLocalStorageDataLocation);  //transforming json string into a js object
        }

        if(listArrayName.indexOf(list1[index].name) != -1)
          return;

        listArrayName.push(name); 
        listArrayLocation.push(location);
        localStorage.setItem("Name", JSON.stringify(listArrayName)); //transforming js object into a json string
        localStorage.setItem("Location", JSON.stringify(listArrayLocation)); //transforming js object into a json string
        showPlaces(); //calling showTask function
      }
   });
   
  });
}

function refresh(){

  list2.forEach((item, index)=>{
    item.setMap(null);
  });

  list1 = [];
  list2 = [];
  list3 = [];
  getNearby();
}

function initSearchBox(){
  const input = document.getElementById("inputlocation"); // get input search element
  const searchBox = new google.maps.places.SearchBox(input); // create SearchBox from input search element
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(input); // put input search element to map

  // Listen for the event fired when the user selects a prediction and retrieve
  searchBox.addListener("places_changed", () => { 
    const places = searchBox.getPlaces();
    if (places.length == 0) {
      return;
    }

    // Clear out the old markers.
    markers.forEach((marker) => {
      marker.setMap(null);
    });

    markers = [];

    // For each place, get the icon, name and location.
    const bounds = new google.maps.LatLngBounds();

    places.forEach((place) => {
      if (!place.geometry || !place.geometry.location) {
        console.log("Returned place contains no geometry");
        return;
      }
      
      // Create a marker for each place.
      markers.push(
        new google.maps.Marker({
          map,
          title: place.name,
          position: place.geometry.location,
        })
      );
      pos.lat = place.geometry.location.lat();
      pos.lng = place.geometry.location.lng();
      weatherBalloon(pos);


      if (place.geometry.viewport) {
        // Only geocodes have viewport.
        bounds.union(place.geometry.viewport);
      } else {
        bounds.extend(place.geometry.location);
      }
    });

    map.fitBounds(bounds);
    map.setZoom(17);
    map.setCenter(pos);

  });

}

function calculateAndDisplayRoute(directionsService, directionsRenderer) {
      let getLocalStorageDataLocation = localStorage.getItem("Location");
      listArrayLocation = JSON.parse(getLocalStorageDataLocation);
      var start = mypos; // current location -> origin place
      var end = listArrayLocation[listArrayLocation.length - 1]; // destination place
      var items = []; // 
      for(var i = 0; i < listArrayLocation.length -1; i++){
        items.push(listArrayLocation[i]);
      }
      var waypoints = [];
      for (var i = 0; i < items.length; i++) {
          var address = items[i];
          if (address !== "") {
              waypoints.push({
                  location: address,
                  stopover: true
              });
          }
      }      

      const selectedMode = document.getElementById("mode").value;

      directionsService.route(
          {
              origin: start,
              destination: end,
              waypoints: waypoints,
              optimizeWaypoints: true,
              travelMode: google.maps.TravelMode[selectedMode],
          },
          (response, status) => {
              if (status === "OK") {
                  directionsRenderer.setDirections(response);
              }
              else {
                  window.alert("Directions request failed duo to " + status);
              }
          }
      );
}

function weatherBalloon( pos ) {
	var key = "0163665dccb0d386ee3db3bec2b27284";
  
	fetch('https://api.openweathermap.org/data/2.5/weather?lat='+pos.lat+'&lon=' + pos.lng+ '&cnt=10&appid=' + key)  
	.then(function(resp) { return resp.json() }) // Convert data to json
	.then(function(data) {
		drawWeather(data); // Call drawWeather
	})
	.catch(function() {
		// catch any errors
	});

}


function drawWeather( d ) {
	var celcius = Math.round(parseFloat(d.main.temp)-273.15);
	//var fahrenheit = Math.round(((parseFloat(d.refresh.temp)-273.15)*1.8)+32); 
	var des = document.getElementById("description");
	var temp = document.getElementById('temp');
	var location = document.getElementById('location');
  des.innerHTML = d.weather[0].description;
  location.innerHTML = d.name;
  temp.innerHTML = celcius + '&deg;';
}

function handleClickCB(cb) {

  let id = parseInt(cb.id);
  switch(id) {
    case 1:
      if(cb.checked){
        type.push("bar");
      }
      else{
        let index = type.indexOf("bar");
        type.splice(index, 1);
      }
      break;
    case 2:
      if(cb.checked){
        type.push("restaurant");
      }
      else{
        let index = type.indexOf("restaurant");
        type.splice(index, 1);
      }
      break;
    case 3:
      if(cb.checked){
        type.push("atm");
      }
      else{
        let index = type.indexOf("atm");
        type.splice(index, 1);
      }
      break;
    case 4:
      if(cb.checked){
        type.push("zoo");
      }
      else{
        let index = type.indexOf("zoo");
        type.splice(index, 1);
      }
      break;
    case 5:
      if(cb.checked){
        type.push("cafe");
      }
      else{
        let index = type.indexOf("cafe");
        type.splice(index, 1);
      }
      break;
    default:
      // code block
  }
}

function handleClickSelectBox(select){
  radius = parseInt(select.value);
}


document.getElementById("search").onclick = function(){
  refresh();
};

document.getElementById("inputlocation").onsubmit = function(event){
  event.preventDefault();
};
var num = [1, 2 ,3];

console.log(num.splice(10));











