var express = require('express');
var app = express();
var server = require('http').Server(app);
//var io = require('socket.io').listen(server);
var io = require('socket.io')(server);

var players = {};
var star = {
  x: 400,
  y: 300
};
var scores = {
  blue: 0,
  red: 0
};

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

const boardWidth = 800;
const boardHeight = 600;

let objectPosition = {
  width: boardWidth / 2,
  height: boardHeight / 2
};

let velocity = {
  x: 1, // Initial velocity in the x-direction
  y: 1  // Initial velocity in the y-direction
};

let cooldown = false;
let player_actually_bouncing = null

function handleGoal(goalRed, goalBlue) {
  if (!cooldown) {
    if (goalRed) {
      scores.red += 1;
    }
    if (goalBlue) {
      scores.blue += 1;
    }
    io.emit('scoreUpdate', scores);
    cooldown = true;
    setTimeout(() => {
      cooldown = false;
    }, 1000);
  }
}

function updatePosition() {
  // Check for collisions with battleships (you need to implement this logic)
  const collisionWithBattleship = checkCollisionWithBattleships();

  if (collisionWithBattleship && !cooldown) {
    // Handle collision: change direction or perform any other necessary actions
    console.log('now collistion occured')
    handleCollision();
    cooldown = true;
    setTimeout(() => {
      cooldown = false;
    }, 1000);
  }

  const goalRed = checkGoal('red');
  const goalBlue = checkGoal('blue');

  // handleGoal(goalRed, goalBlue);

  if (goalRed && !cooldown) {
    scores.red += 1;
    io.emit('scoreUpdate', scores);
    cooldown = true;
    setTimeout(() => {
      cooldown = false;
    }, 1000);
  }
  
  if (goalBlue && !cooldown) {
    scores.blue += 1;
    io.emit('scoreUpdate', scores);
    cooldown = true;
    setTimeout(() => {
      cooldown = false;
    }, 1000);
  }

  // Update the position based on the velocity
  star.x += velocity.x;
  star.y += velocity.y;
  objectPosition.width += velocity.x;
  objectPosition.height += velocity.y;

  // Check for collisions with the board boundaries
  if (objectPosition.width <= 0 || objectPosition.width >= boardWidth) {
    // Reverse the velocity in the x-direction on collision
    velocity.x = -velocity.x;
  }

  if (objectPosition.height <= 0 || objectPosition.height >= boardHeight) {
    // Reverse the velocity in the y-direction on collision
    velocity.y = -velocity.y;
  }

  // Emit the current position to all connected clients
  io.emit('objectPosition', { width: objectPosition.width, height: objectPosition.height });
}

function checkGoal (team) {
  let is_at_goal_line;
  if (team == 'red') {
    is_at_goal_line = star.x > 796
  }
  if (team == 'blue') {
    is_at_goal_line = star.x < 4
  }
  if (is_at_goal_line && star.y > 146 && star.y < 375) {
    return true;
  }
  return false;
}


function checkCollisionWithBattleships() {
  for (const player_id of Object.keys(players)) {
    if (
      Math.abs(players[player_id].x - star.x) < 50 &&
      Math.abs(players[player_id].y - star.y) < 50
  ) {
    player_actually_bouncing = player_id;
    return true;
  }}
  return false;
}

function handleCollision() {
  if (player_actually_bouncing) {
    // Calculate the direction vector between the star and the player
    const directionX = star.x - players[player_actually_bouncing].x;
    const directionY = star.y - players[player_actually_bouncing].y;

    // Normalize the direction vector
    const length = Math.sqrt(directionX * directionX + directionY * directionY);
    const normalizedDirectionX = directionX / length;
    const normalizedDirectionY = directionY / length;

    // Assign the normalized direction to the velocity
    velocity.x = normalizedDirectionX;
    velocity.y = normalizedDirectionY;

    player_actually_bouncing = null;
  }
  // Emit an event to inform clients about the collision or the updated direction
  io.emit('collisionOccurred', { newDirection: { x: velocity.x, y: velocity.y } });
}

io.on('connection', function (socket) {
  if (io.engine.clientsCount === 2) {
    var interval = setInterval(updatePosition, 10);
  } else {
    clearInterval(interval);
  }

  console.log('a user connected: ', socket.id);
  // create a new player and add it to our players object
  players[socket.id] = {
    rotation: 0,
    x: (io.engine.clientsCount % 2 == 0) ? 200 : 600,
    // x: Math.floor(Math.random() * 700) + 50,
    y: 300,
    // y: Math.floor(Math.random() * 500) + 50,
    playerId: socket.id,
    team: (io.engine.clientsCount % 2 == 0) ? 'red' : 'blue'
  };
  // send the players object to the new player
  socket.emit('currentPlayers', players);
  // send the star object to the new player
  socket.emit('starLocation', star);
  // send the current scores
  socket.emit('scoreUpdate', scores);
  // update all other players of the new player
  socket.broadcast.emit('newPlayer', players[socket.id]);

  // when a player disconnects, remove them from our players object
  socket.on('disconnect', function () {
    if (io.engine.clientsCount !== 2) {
      clearInterval(interval);
    }
    // clearInterval(interval);
    console.log('user disconnected: ', socket.id);
    delete players[socket.id];
    // emit a message to all players to remove this player
    io.emit('disconn', socket.id);
  });

  socket.on('starLocation', function (changeStar) {
    star.x = changeStar.x;
    star.y = changeStar.y;
    console.log(star.x)
  });

  // when a player moves, update the player data
  socket.on('playerMovement', function (movementData) {
    players[socket.id].x = movementData.x;
    players[socket.id].y = movementData.y;
    players[socket.id].rotation = movementData.rotation;
    // emit a message to all players about the player that moved
    socket.broadcast.emit('playerMoved', players[socket.id]);
  });


});

server.listen(8081, function () {
  console.log(`Listening on ${server.address().port}`);
});
