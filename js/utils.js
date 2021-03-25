
// That function gets (i,j,value) and render it into the current cell in board
function renderCell(i,j, value) {
    var elCell = document.querySelector(`.cell-${i}-${j}`)
    elCell.innerHTML = value
  }

 // That function gets (min,max) and returns a random number (the maximum is exclusive)
  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
  } 

