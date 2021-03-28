'use strict'
//
const MINE_IMG = '<img src="./img/mine.png"/>'
const FLAG_IMG = '<img src="./img/flag.png"/>'
const WIN_EMOJI = '😎'
const LOSE_EMOJI = '🤯'
const NORAML_EMOJI = '😃'
const WRONG_EMOJI = '😵'
const LIFE_EMOJI = '❤️'


// Global variables
var gBestScore = {
    beginnerBest: 0,
    mediumBest: 0,
    expertBest: 0
}
var gLevel = {}
// var gHints = [false, false, false]
var gBoard
var gMinesPos = []
var gTimeInterval
var gGame = {
    isOn: false,
    isFirstClick: false,
    isStartTime: false,
    isManually: false,
    life: 2,
    safeClickCount: 3,
    shownCount: 0,
    markedCount: 0,
    foundMinesCount: 0,
    secsPassed: 0
}

// That function called when page loads (start the default game)
function initGame() {
    gLevel = {
        Size: 4,
        Mines: 2
    }
    gBoard = buildBoard()
    renderBoard(gBoard)
    updateLife(0)
    renderScore()
    gGame.isOn = true
}

// That function called when user clicks level change and render a new board 
function changeLevel(size, mines) {
    if (gGame.shownCount) return
    gLevel = {
        Size: size,
        Mines: mines
    }
    if (gLevel.Size === 8) {
        gGame.life = 3
    } else if (gLevel.Size === 12) {
        gGame.life = 4
    } else {
        gGame.life = 2
    }
    updateLife(0)
    renderScore()
    gBoard = buildBoard()
    renderBoard(gBoard)
}

// That function builds a matrix by size and mines count
function buildBoard() {
    var board = []
    for (var i = 0; i < gLevel.Size; i++) {
        board[i] = []
        for (var j = 0; j < gLevel.Size; j++) {
            var currCell = {
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false
            }
            board[i][j] = currCell
        }
    }
    return board
}

// That function gets board (Size * Size) and render it to HTML
function renderBoard(board) {
    var strHTML = '<table border="" padding="0"><tbody>'
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>'
        for (var j = 0; j < board.length; j++) {
            var className = `cell-${i}-${j}`
            var buttonHTML = `<button onclick="expandShown(${i},${j});manuallyCreateMines(${i},${j})" oncontextmenu="cellMarked(this,${i},${j})"></button>`
            strHTML += `<td class="${className}">${buttonHTML}</td>`
        }
        strHTML += '</tr>'
    }
    strHTML += '</tbody></table>'
    var elGameBoard = document.querySelector('.game-board')
    elGameBoard.innerHTML = strHTML
}

// That function gets board place mines in random cell and returns array of mines positions
function setMines(board) {
    gMinesPos = []
    for (var i = 0; i < gLevel.Mines; i++) {
        var randomI = getRandomInt(0, board.length)
        var randomJ = getRandomInt(0, board.length)
        var currRandomCell = board[randomI][randomJ]
        if (!currRandomCell.isMine && !currRandomCell.isShown) {
            currRandomCell.isMine = true
            var currMinePos = {
                i: randomI,
                j: randomJ
            }
            gMinesPos.push(currMinePos)
        } else i--
    }
    return gMinesPos
}

// That function count mines around each cell and set the cell's minesAroundCount
function setMinesNegsCount(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board.length; j++) {
            var currMinesCount = getMinesAroundCount(i, j, board)
            var currCell = board[i][j]
            currCell.minesAroundCount = currMinesCount
        }
    }
}

// That function gets (cellI, cellJ, board) and count mines around that cell location
function getMinesAroundCount(cellI, cellJ, board) {
    var minesAroundCount = 0
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= board.length) continue;
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (j < 0 || j >= board.length) continue;
            if (i === cellI && j === cellJ) continue;
            var currCell = board[i][j]
            if (currCell.isMine) minesAroundCount++
        }
    }
    return minesAroundCount
}

// That function gets (i,j) show and render the current cell (NOT MARKED CELL)
function cellClicked(i, j) {
    var currCell = gBoard[i][j]
    if (!currCell.isMine) {
        if (currCell.minesAroundCount) {
            renderCell(i, j, currCell.minesAroundCount)
        } else {
            renderCell(i, j, '')
        }
    } else {
        renderCell(i, j, MINE_IMG)
        var elMineCell = document.querySelector(`.cell-${i}-${j}`)
        elMineCell.style.backgroundColor = 'crimson'
        var elEmoji = document.querySelector('.emoji-btn')
        elEmoji.innerText = WRONG_EMOJI
        updateLife(-1)
        if (gGame.life) {
            setTimeout(function () {
                elMineCell.style.backgroundColor = 'lightgray'
                elMineCell.innerHTML = `<button onclick="expandShown(${i},${j});manuallyCreateMines(${i},${j})" oncontextmenu="cellMarked(this,${i},${j})"></button>`
                elEmoji.innerText = NORAML_EMOJI
            }, 500)
            return
        } else {
            gameOver()
        }
    }
    currCell.isShown = true
    gGame.shownCount++
    if ((gGame.shownCount === (gLevel.Size ** 2) - (gLevel.Mines)) &&
        (gGame.foundMinesCount === gLevel.Mines)) {
        victory()
    }
}

// That function called on right click to mark a cell with flag (suspected to be a mine)
function cellMarked(elBtn, i, j) {
    if (!gGame.isOn) return
    if (!gGame.isStartTime) {
        gGame.isStartTime = true
        startTime()
    }
    var currCell = gBoard[i][j]
    if (!currCell.isShown) {
        if (!currCell.isMarked) {
            currCell.isMarked = true
            updateMarkCells(1)
            elBtn.innerHTML = FLAG_IMG
            if (currCell.isMine) {
                gGame.foundMinesCount++
                if ((gGame.shownCount === (gLevel.Size ** 2) - (gLevel.Mines)) &&
                    (gGame.foundMinesCount === gLevel.Mines)) {
                    victory()
                }
            }
        } else {
            currCell.isMarked = false
            updateMarkCells(-1)
            elBtn.innerHTML = ''
        }
    }
}

/* That function gets (i,j) and called when user clicks a cell with no mines around,
we need to open not only that cell, but also its neighbors. */
function expandShown(cellI, cellJ) {
    if (!gGame.isOn) return
    if (gGame.isHintClick) return
    if (!gGame.isStartTime) {
        gGame.isStartTime = true
        startTime()
    }
    var currCell = gBoard[cellI][cellJ]
    if (currCell.isShown) return
    if (currCell.minesAroundCount) {
        cellClicked(cellI, cellJ)
        return
    } else if (currCell.isMine) {
        cellClicked(cellI, cellJ)
        return
    } else if (!gGame.shownCount) {
        gGame.isFirstClick = true
    }
    cellClicked(cellI, cellJ)
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (j < 0 || j >= gBoard.length) continue
            if (i === cellI && j === cellJ) continue
            if (gGame.isFirstClick && !gGame.isManually) {
                gMinesPos = setMines(gBoard)
                setMinesNegsCount(gBoard)
                gGame.isFirstClick = false
            }
            if(gGame.isManually){
                setMinesNegsCount(gBoard)
            }
            if (gBoard[i][j].isShown) continue
            if (gBoard[i][j].isMine) continue
            if (gBoard[i][j].isMarked) continue
            cellClicked(i, j)
        }
    }
}

// That function update the life in the game
function updateLife(diff) {
    gGame.life += diff
    var currLifeStr = LIFE_EMOJI.repeat(gGame.life)
    var elGameLife = document.querySelector('.game-life')
    elGameLife.innerText = 'Life: ' + currLifeStr

}

// That function update the marked cells
function updateMarkCells(diff) {
    gGame.markedCount += diff
    var elMarkedCells = document.querySelector('.marked-cells')
    elMarkedCells.innerText = 'Flag counter: ' + gGame.markedCount
}

// That function called when victory
function victory() {
    gGame.isOn = false
    gGame.isStartTime = false
    console.log(gGame.secsPassed)
    clearInterval(gTimeInterval)
    updateBestScore(gLevel.Size, gGame.secsPassed)
    var elGameLife = document.querySelector('.game-life')
    elGameLife.innerText = 'Victory !'
    document.querySelector('.emoji-btn').innerText = WIN_EMOJI
}

// That function called when game over
function gameOver() {
    showMines()
    gGame.isOn = false
    gGame.isStartTime = false
    clearInterval(gTimeInterval)
    var elGameLife = document.querySelector('.game-life')
    elGameLife.innerText = 'Game Over'
    document.querySelector('.emoji-btn').innerText = LOSE_EMOJI
}

// That function show all the mines when game is over
function showMines() {
    for (var i = 0; i < gMinesPos.length; i++) {
        var currI = gMinesPos[i].i
        var currJ = gMinesPos[i].j
        var currMine = gBoard[currI][currJ]
        if (!currMine.isShown) renderCell(currI, currJ, MINE_IMG)
    }
}

// That function start the time in game when user clicking right/left on cell
function startTime() {
    gTimeInterval = setInterval(function () {
        gGame.secsPassed += 11
        var elGameTime = document.querySelector('.game-time span')
        elGameTime.innerText = (gGame.secsPassed / 1000)
    }, 10)
    return gTimeInterval
}

// That function reset the game
function resetGame(elBtn) {
    clearInterval(gTimeInterval)
    elBtn.innerText = NORAML_EMOJI
    var elGameTime = document.querySelector('.game-time span')
    elGameTime.innerText = '0.000'
    var elMarkedCells = document.querySelector('.marked-cells')
    elMarkedCells.innerText = 'Flag counter: 0'
    var elClicksSpan = document.querySelector('.reset-container h3 span')
    elClicksSpan.innerText = '3'
    var elManuallyBtn = document.querySelector('.manuallymode-btn')
    elManuallyBtn.innerText = 'Manually create mines'
    gLevel = {
        Size: 4,
        Mines: 2
    }
    gGame = {
        isOn: true,
        isFirstClick: false,
        isStartTime: false,
        isManually: false,
        life: 2,
        safeClickCount: 3,
        shownCount: 0,
        markedCount: 0,
        foundMinesCount: 0,
        secsPassed: 0
    }
    gMinesPos = []
    gBoard = buildBoard()
    renderBoard(gBoard)
    updateLife(0)
    renderScore()
}

// That function gets (size,secPassed) and update the best score on board
function updateBestScore(size, secsPassed) {
    if (!localStorage.getItem('beginner') && !localStorage.getItem('medium') && !localStorage.getItem('expert')) {
        localStorage.setItem('beginner', Infinity)
        localStorage.setItem('medium', Infinity)
        localStorage.setItem('expert', Infinity)
    }
    switch (size) {
        case 4:
            var currBeginnerBest = localStorage.getItem('beginner')
            if ((secsPassed / 1000) < currBeginnerBest) {
                localStorage.setItem('beginner', (secsPassed / 1000))
                var elBeginnerScore = document.querySelector('.beginner-level span')
                elBeginnerScore.innerText = localStorage.getItem('beginner')
            }
            break
        case 8:
            var currMediumBest = localStorage.getItem('medium')
            if ((secsPassed / 1000) > currMediumBest) {
                localStorage.setItem('medium', (secsPassed / 1000))
                var elBeginnerScore = document.querySelector('.medium-level span')
                elBeginnerScore.innerText = localStorage.getItem('medium')
            }
            break
        case 12:
            var currExpertBest = localStorage.getItem('expert')
            if ((secsPassed / 1000) > currExpertBest) {
                localStorage.setItem('expert', (secsPassed / 1000))
                var elBeginnerScore = document.querySelector('.expert-level span')
                elBeginnerScore.innerText = localStorage.getItem('expert')
            }
            break
    }
}

// That function render the current best score
function renderScore() {
    var elBeginnerScore = document.querySelector('.beginner-level span')
    var elMediumScore = document.querySelector('.medium-level span')
    var elExpertScore = document.querySelector('.expert-level span')
    if (localStorage.getItem('beginner') !== Infinity) {
        elBeginnerScore.innerText = localStorage.getItem('beginner')
    }
    if (localStorage.getItem('medium') === Infinity) {
        elMediumScore.innerText = localStorage.getItem('medium')
    }
    if (localStorage.getItem('expert') === Infinity) {
        elExpertScore.innerText = localStorage.getItem('expert')
    }
}

// That function gets board and returns an array with locations of no mine cells
function getNoMineCells(board) {
    var noMineCells = []
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board.length; j++) {
            if (board[i][j].isMine) continue
            if (board[i][j].isShown) continue
            var currPos = {
                i,
                j
            }
            noMineCells.push(currPos)
        }
    }
    return noMineCells
}

// That function marks a safe cell (no mine cell) when user click on the safe btn
function safeClick(elBtn) {
    if (!gGame.safeClickCount) return
    var noMineCells = getNoMineCells(gBoard)
    console.log(noMineCells)
    var randomCellIdx = getRandomInt(0, noMineCells.length)
    var randomCellPos = noMineCells[randomCellIdx]
    console.log(randomCellPos.i)
    var elCell = document.querySelector(`.cell-${randomCellPos.i}-${randomCellPos.j} button`)
    elCell.style.backgroundColor = 'yellow'
    setTimeout(function () { elCell.style.backgroundColor = 'grey' }, 1000)
    gGame.safeClickCount--
    var elClicksSpan = document.querySelector('.reset-container h3 span')
    elClicksSpan.innerText = gGame.safeClickCount
}

// That function change the game mode to manually create mode when user click on the manually btn
function manuallyMode(elBtn){
if(gGame.isOn && gGame.isManually) return
if(!gGame.isManually){
    gGame.isManually = true
    gGame.isOn = false
    elBtn.innerText = 'Start to set Mines'
} 
}

// That function sets mines when user is clicking on cells (only in the before mines set)
function manuallyCreateMines(cellI,cellJ){
    if(!gGame.isManually) return
    if(gGame.isManually && gGame.isOn) return
    if(gBoard[cellI][cellJ].isMine) return
    var elCell = document.querySelector(`.cell-${cellI}-${cellJ} button`)
    elCell.style.backgroundColor = 'black'
    setTimeout(function(){elCell.style.backgroundColor = 'grey'},500)
    gBoard[cellI][cellJ].isMine = true
    var currMinePos = {
        i: cellI,
        j: cellJ
    }
    gMinesPos.push(currMinePos)
    if(gMinesPos.length === gLevel.Mines){
        var elManuallyBtn = document.querySelector('.manuallymode-btn')
        elManuallyBtn.innerText = 'Set is finished'
        gGame.isOn = true
    }
}
    


