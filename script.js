const placeList = document.querySelector(".placeList");
const deleteAllBtn = document.querySelector(".footer button");

showPlaces();

function showPlaces(){
  let getLocalStorageDataName = localStorage.getItem("Name");
  let getLocalStorageDataLocation = localStorage.getItem("Location");
  if(getLocalStorageDataName == null){
    listArrayName = [];
    listArrayLocation = [];
  }else{
    listArrayName = JSON.parse(getLocalStorageDataName); 
    listArrayLocation = JSON.parse(getLocalStorageDataLocation); 
  }

  const placeCount = document.querySelector(".placeCount");
  placeCount.textContent = listArrayName.length; 

  if(listArrayName.length > 0){ //if array length is greater than 0
    deleteAllBtn.classList.add("active"); //active the delete button
  }else{
    deleteAllBtn.classList.remove("active"); //unactive the delete button
  }

  let newLiTag = "";
  listArrayName.forEach((element, index) => {
    newLiTag += `<li>${element}<span class="icon" onclick="deletePlace(${index})"><i class="fas fa-trash"></i></span></li>` + `<span class="location" style="display:none;">${JSON.stringify(listArrayLocation[index])}</span>`;
  });
  placeList.innerHTML = newLiTag; //adding new li tag inside ul tag
}

// delete task function
function deletePlace(index){
  let getLocalStorageDataName = localStorage.getItem("Name");
  let getLocalStorageDataLocation = localStorage.getItem("Location");
  listArrayName = JSON.parse(getLocalStorageDataName);
  listArrayLocation = JSON.parse(getLocalStorageDataLocation);
  listArrayName.splice(index, 1); //delete or remove the li
  listArrayLocation.splice(index, 1); //delete or remove the li
  localStorage.setItem("Name", JSON.stringify(listArrayName));
  localStorage.setItem("Location", JSON.stringify(listArrayLocation));
  showPlaces(); //call the showPlaces function
}

// delete all tasks function
deleteAllBtn.onclick = ()=>{
    localStorage.removeItem("Name");
    localStorage.removeItem("Location");
    
    showPlaces(); //call the showPlaces function
  }
