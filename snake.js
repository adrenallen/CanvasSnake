function CanvasSnake(){
	//Global variables with descriptions
	var blockSize = 20;	//size of blocks in pixels
	var mapSize = 36;	//# of block x and y  (must be even or same as block size at least even or odd)
	var speed = 1;		//speed of gameplay
	var berryTime = 280;	//How long berries stay before disappearing
	var berryFreq = .01;		//frequency of berry spawns (0.00 - 1.00)
	var berryVal = 10;	//value of berries
	var FPS = 30;
	var active = 0;	//game is active
	var snakeColor = 'blue';
	var berryColor = 'red';
	var badBerryColor = 'black';
	var gameContainer;
	
	var game;	//The game object (includes restart/pause/resume/etc)	
	
	var leaderboard;
	
	//Berry object constructor at x,y coords
	function berry(x, y){
		this.x = x;
		this.y = y;
		this.timer = 0;
		this.bad = 0;
	}
	
	//snake part constructor
	function snakePart(x, y){
		this.x = x;
		this.y = y;
	}

	//Game object
	function gameObject(){
		
		//Object variables
		this.play;	//the interval refresh
		this.snake;	//the snake part locations 0 = head
		this.berries;	//the berry locations
		this.direction = 'E';	//direction of the snake
		this.undirection = 'W';	//last direction
		this.score = 0;	//player score
		this.unscore = 0;	//negative score from missed berries
		this.speedCounter = 0;	//Used to alter speed of the snake
		
		//Object functions
		
		this.restart = restart;	//starts a new game
		this.pause = pause;	//pauses active game
		this.resume = resume;	//resumes a paused game
		this.resetMap = resetMap;	//resets the map matrix, snake matrix, berry matrix
		this.moveSnake = moveSnake;	//moves the snake one tick
		this.drawMap = drawMap;	//Draw the current frame to the map
		this.addSnakePart = addSnakePart;	//adds a piece to the snake
		this.generateBerry = generateBerry;	//generates a berry randomly
		this.checkCollisions = checkCollisions;	//checks the snake head for collisions to berry/self/walls
		this.loseGame = loseGame;	//if you lose the game for any reason, this fires
		this.berryTick = berryTick;	//Adds time to the berry or removes it
	
		//resume an active game
		function resume(){
			this.active = 1;
			this.play = setInterval(function(){
					game.checkCollisions();
					game.berryTick();
					game.moveSnake();
					game.generateBerry();
					game.drawMap();
					
				}, 1000/FPS);
		}
		
		//Pause an active game
		function pause(){
			clearInterval(this.play);
		}
		
		//Starts a new game and resumes
		function restart(){
			this.pause();
			this.score = 0;
			this.unscore = 0;
			this.resetMap();
			
			this.resume();
		}
		
		function berryTick(){
			for(var i = 0; i < this.berries.length; i++){
				if(this.berries[i].timer >= berryTime){
					if(this.berries[i].bad == 1){
						this.berries.splice(i, 1);
					}else{
						this.unscore += berryVal;
						this.berries[i].bad = 1;
						this.berries[i].timer = 0;
					}					
				}else{
					this.berries[i].timer++;
				}
			}
		}
		
		//moves the snake one tick
		function moveSnake(){
			if(this.speedCounter >= speed){
				
				//Move the snake positions
				for(var i = this.snake.length-1; i > 0; i--){
					this.snake[i].x = this.snake[i-1].x;
					this.snake[i].y = this.snake[i-1].y;
				}
				
				//Now move the head
				if(this.direction == 'W'){
					this.snake[0].x--;
					this.undirection = 'E';
				}else if(this.direction == 'N'){
					this.snake[0].y--;
					this.undirection = 'S';
				}else if(this.direction == 'E'){
					this.snake[0].x++;
					this.undirection = 'W';
				}else if(this.direction == 'S'){
					this.snake[0].y++;
					this.undirection = 'N';
				}
				
				this.speedCounter = 0;	//set back to zero
			}else{
				this.speedCounter++;	//increase one tick
			}		
		}
		
		//Adds a part to the snake
		function addSnakePart(){
			var part = this.snake[this.snake.length-1];
			this.snake.push(new snakePart(part.x, part.y));
		}
		
		//Checks the snake head for any collisions
		function checkCollisions(){
			var headX = this.snake[0].x;
			var headY = this.snake[0].y;
			
			for(var i = 1; i < this.snake.length; i++){
				if(this.snake[i].x == headX && this.snake[i].y == headY){
					this.loseGame();
					return;
				}else if(headX > mapSize-1 || headX < 0 || headY > mapSize-1 || headY < 0){
					this.loseGame();
				}else{
					for(var b = 0; b < this.berries.length; b++){
						if(this.berries[b].x == headX && this.berries[b].y == headY){
							if(this.berries[b].bad == 1){
								this.loseGame();
							}else{
								this.berries.splice(b,1);
								this.addSnakePart();
								this.score += berryVal;
							}
						}
					}
				}
			}
			
		}
		
		//If you lose the game
		function loseGame(){
			this.pause();
			if(this.active == 1){
				this.active = 0;
				swal("You Lose", "Final Score: " + (this.score-this.unscore));
				// submitScore(this.score-this.unscore);
			}
		}
		
		//Generates a berry randomly
		function generateBerry(){
			var change = Math.random()*100000;
			if(change/100000 < berryFreq){
				var x,y;
				x = Math.floor(Math.random()*(mapSize-1));
				y = Math.floor(Math.random()*(mapSize-1));
				this.berries.push(new berry(x, y));
			}
		}
		
		//Rebuilds the map matrix
		function resetMap(){
			
			this.snake = new Array(2);
			this.snake[0] = new snakePart(mapSize/2,mapSize/2);
			this.snake[1] = new snakePart(this.snake[0].x+1, this.snake[0].y);
			
			this.berries = new Array();
			
		}
		
		//Renders the map
		function drawMap(){				
			var can = getCan();
			var ctx = can.getContext('2d');
			
			var x, y;	//x and y coords to draw on
			
			ctx.clearRect(0, 0, can.width, can.height);
			
			ctx.fillStyle = berryColor;
			//draw the berries
			for(var i = 0; i < this.berries.length; i++){
				x = this.berries[i].x;
				y = this.berries[i].y;
				if(this.berries[i].bad == 1){
					ctx.fillStyle = badBerryColor;
					
					ctx.beginPath();
					ctx.moveTo((x*blockSize)+(blockSize/2), y*blockSize);
					ctx.lineTo((x*blockSize)+blockSize, (y*blockSize)+(blockSize/2));
					ctx.lineTo((x*blockSize)+(blockSize/2), (y*blockSize)+blockSize);
					ctx.lineTo(x*blockSize, (y*blockSize)+(blockSize/2));
					ctx.closePath();
					ctx.fill();
					
					ctx.fillStyle = berryColor;
				}else{
					ctx.beginPath();
					ctx.arc((x*blockSize)+(blockSize/2), (y*blockSize)+(blockSize/2), blockSize/2, 0, 2*Math.PI);
					ctx.fill();
				}
			}
			
			ctx.fillStyle = snakeColor;
			
			//draw the snake
			for(var i = 0; i < this.snake.length; i++){
				x = this.snake[i].x;
				y = this.snake[i].y;
				ctx.fillRect(x*blockSize, y*blockSize, blockSize, blockSize);
			}
			
			//Prints the score
			document.getElementById("score").innerHTML = "Score: " + (this.score-this.unscore);			
		
		}
			
	
	}	//end game class
	
	//Gets and returns the canvas
	function getCan(){
		return document.getElementById("playground");
	}
	
	//Listens for key events
	function keyListen(e){
		//add c_code for blaze so he can use WASD to get a highscore
		var c_code = e.code.toLowerCase();
		var k = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
		
		if((k == 37 || c_code == "keya") && game.undirection != 'W'){
			game.direction = 'W';
		}else if((k == 38 || c_code == "keyw") && game.undirection != 'N'){
			game.direction = 'N';
		}else if((k == 39 || c_code == "keyd") && game.undirection != 'E'){
			game.direction = 'E';
		}else if((k == 40 || c_code == "keys") && game.undirection != 'S'){
			game.direction = 'S';
		}
		
		if(k == 13){
			game.restart();
		}
		
	}

	function createGame(elemID){
		gameContainer = document.getElementById(elemID);
		window.addEventListener("keydown", keyListen, true);

		var can = getCan();
		can.width = mapSize*blockSize;
		can.height = mapSize*blockSize;
		var ctx = can.getContext('2d');
		ctx.font="25px Calibri";
		ctx.fillText("Welcome to Snake 1.5",can.width/2-(ctx.measureText("Welcome to Snake 1.5").width/2), can.height/2-40-40);
		ctx.fillText("Click Here To Focus The Frame",can.width/2-(ctx.measureText("Click Here To Focus The Frame").width/2), can.height/2);
		ctx.fillText("Press Enter to Begin",can.width/2-(ctx.measureText("Press Enter to Begin").width/2), can.height/2+40);
		ctx.fillText("Arrow Keys to Control",can.width/2-(ctx.measureText("Arrow Keys to Control").width/2), can.height/2+80);
		
		game = new gameObject();
	}
	
}