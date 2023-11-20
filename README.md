# Football in Phaser

This is simple online multiplayer football game. The server side runs on nodejs server, and players join with browser.

How to run server side:
- install nodejs - see https://nodejs.org/en - I tested this on version 20.9.0 and it works correctly
- clone directory, install packages:
```
git clone https://github.com/pali08/football_in_phaser_multiplayer.git
cd football_in_phaser_multiplayer
npm install

```
- run server
```
node server.js
```

How to connect to server:
- Get server ip address
if player is on same pc as server, ip the address is
localhost:8081
otherwise check ip address on server e.g. by
```
$ ifconfig
```
- In browser go to address:
```
<your ip address>:8081
```
the port 8081 is set in server.js -> server.listen and can be changed there

How to play:
The player moves in his feets direction by upper arrow and can be rotated by left and right arrow. The goal is to score into opponent's gate. The ball starts to move once two players joined. Note that this is simple amateur game with some bugs, e.g. multiple browser tabs == multiple players.

The game code was inspired by Scott Westover's tutorial:
https://gamedevacademy.org/create-a-basic-multiplayer-game-in-phaser-3-with-socket-io-part-2/
