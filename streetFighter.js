const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const health1El = document.getElementById('health1');
const health2El = document.getElementById('health2');
const gameOverEl = document.getElementById('gameOver');
const winnerEl = document.getElementById('winner');

//slike
const bgImg = new Image();
bgImg.src = "ozadje.png";

const player1Img1 = new Image();
player1Img1.src = 'p1.png';
const player1Img2 = new Image();
player1Img2.src = 'p11.png';

const player2Img1 = new Image();
player2Img1.src = 'p2.png';
const player2Img2 = new Image();
player2Img2.src = 'p22.png';
//HIT images>
const player1HitImg = new Image();
player1HitImg.src = 'p1hit.png';
const player2HitImg = new Image();
player2HitImg.src = 'p2hit.png';

let imagesLoaded = 0;

[player1Img1, player1Img2, player2Img1, player2Img2, player1HitImg, player2HitImg].forEach(img => {
    img.onload = () => { imagesLoaded++; startGameIfReady(); }
});

function startGameIfReady() {
    if (imagesLoaded === 6) {
        updateHealth();
        requestAnimationFrame(gameLoop);
    }
}

//Game setup
const game = {
    player1: { x:50, y:150, width:100, height:200, health:100, punching:false, punchX:0, punchTime:0, velocityX:0, velocityY:0, jumping:false, speed:300, jumpPower:600 },
    player2: { x:650, y:150, width:100, height:200, health:100, punching:false, punchX:0, punchTime:0, velocityX:0, velocityY:0, jumping:false, speed:300, jumpPower:600 }
};

const PUNCH_DURATION = 300;
const PUNCH_DISTANCE = 50; //genauuuu
const DAMAGE = 10;
const GRAVITY = 1800;
const GROUND_Y = 150;
const keys = {};

//GIF frame control
let frameTimer = 0;
const frameDuration = 200;
let currentFrame = 0;

//Drawing players
function drawPlayer(player, isPlayer1) {
    let img; //če puncha hit sliko čene navadn loop-a
    if (player.punching) {
        img = isPlayer1 ? player1HitImg : player2HitImg;
    } else {
        img = isPlayer1
            ? (currentFrame === 0 ? player1Img1 : player1Img2)
            : (currentFrame === 0 ? player2Img1 : player2Img2);
    }

    //igralec width - add 60px when punching
    const displayWidth = player.punching ? player.width + 60 : player.width;
    
    //djust x position for player 2 so it extends left when punching
    const displayX = (isPlayer1 || !player.punching) ? player.x : player.x - 60;

    ctx.drawImage(img, displayX, player.y, displayWidth, player.height);
}

//Punch logikaa
function checkHit(attacker, defender, isPlayer1) {
    if (!attacker.punching) return false;

    const punchWidth = attacker.punchX;
    const punchHeight = attacker.height * 0.6;

    const punchBox = {
        x: isPlayer1
            ? attacker.x + attacker.width
            : attacker.x - punchWidth,
        y: attacker.y + attacker.height * 0.2,
        width: punchWidth,
        height: punchHeight
    };

    const defenderBox = {
        x: defender.x,
        y: defender.y,
        width: defender.width,
        height: defender.height
    };

    // AABB collision
    return (
        punchBox.x < defenderBox.x + defenderBox.width &&
        punchBox.x + punchBox.width > defenderBox.x &&
        punchBox.y < defenderBox.y + defenderBox.height &&
        punchBox.y + punchBox.height > defenderBox.y
    );
}

function updatePunch(player, deltaTime) {
    if (!player.punching) return;
    player.punchTime += deltaTime;
    if (player.punchTime < PUNCH_DURATION/2) player.punchX = (player.punchTime / (PUNCH_DURATION/2)) * PUNCH_DISTANCE;
    else if (player.punchTime < PUNCH_DURATION) player.punchX = PUNCH_DISTANCE - ((player.punchTime - PUNCH_DURATION/2)/(PUNCH_DURATION/2))*PUNCH_DISTANCE;
    else { player.punching=false; player.punchX=0; player.punchTime=0; }
}

//Ffizika
function updatePhysics(player, deltaTime) {
    const dt = deltaTime/1000;
    if (player.y < GROUND_Y || player.velocityY < 0) player.velocityY += GRAVITY*dt;
    player.x += player.velocityX*dt;
    player.y += player.velocityY*dt;
    if (player.y >= GROUND_Y) { player.y = GROUND_Y; player.velocityY=0; player.jumping=false; }
    if (player.x < 0) player.x=0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
    player.velocityX *= 0.85;
}

//Movement :)
function handleMovement() {
    if (keys['KeyA']) game.player1.velocityX = -game.player1.speed;
    if (keys['KeyD']) game.player1.velocityX = game.player1.speed;
    if (keys['KeyW'] && !game.player1.jumping && game.player1.y>=GROUND_Y) { game.player1.velocityY=-game.player1.jumpPower; game.player1.jumping=true; }

    if (keys['ArrowLeft']) game.player2.velocityX = -game.player2.speed;
    if (keys['ArrowRight']) game.player2.velocityX = game.player2.speed;
    if (keys['ArrowUp'] && !game.player2.jumping && game.player2.y>=GROUND_Y) { game.player2.velocityY=-game.player2.jumpPower; game.player2.jumping=true; }
}

//Health
function updateHealth() {
    health1El.style.width = game.player1.health + '%';
    health2El.style.width = game.player2.health + '%';
}

//Game over
function checkGameOver() {
    if (game.player1.health <=0) { winnerEl.textContent='PLAYER 2 WINS!'; gameOverEl.style.display='block'; return true; }
    if (game.player2.health <=0) { winnerEl.textContent='PLAYER 1 WINS!'; gameOverEl.style.display='block'; return true; }
    return false;
}

//>>>>>Main loop<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
let lastTime=0, hitCooldown1=0, hitCooldown2=0;

function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    ctx.fillStyle='#6e2e1eff';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // Center line
    ctx.strokeStyle='rgba(255,255,255,0.2)';
    ctx.lineWidth=2;
    ctx.setLineDash([10,10]);
    ctx.beginPath();
    ctx.moveTo(canvas.width/2,0);
    ctx.lineTo(canvas.width/2,canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    //Update frame
    frameTimer += deltaTime;
    if(frameTimer>=frameDuration){ frameTimer=0; currentFrame=(currentFrame+1)%2; }

    updatePunch(game.player1, deltaTime);
    updatePunch(game.player2, deltaTime);
    handleMovement();
    updatePhysics(game.player1, deltaTime);
    updatePhysics(game.player2, deltaTime);

    if(hitCooldown1>0) hitCooldown1-=deltaTime;
    if(hitCooldown2>0) hitCooldown2-=deltaTime;

    if(checkHit(game.player1, game.player2,true) && hitCooldown1<=0) { game.player2.health-=DAMAGE; hitCooldown1=PUNCH_DURATION; updateHealth(); }
    if(checkHit(game.player2, game.player1,false) && hitCooldown2<=0) { game.player1.health-=DAMAGE; hitCooldown2=PUNCH_DURATION; updateHealth(); }

    drawPlayer(game.player1,true);
    drawPlayer(game.player2,false);

    if(!checkGameOver()) requestAnimationFrame(gameLoop);
}

//kontrole
document.addEventListener('keydown', e=>{
    keys[e.code]=true;
    if(e.code==='Space' && !game.player1.punching){ e.preventDefault(); game.player1.punching=true; game.player1.punchTime=0; }
    if(e.code==='Enter' && !game.player2.punching){ e.preventDefault(); game.player2.punching=true; game.player2.punchTime=0; }
});
document.addEventListener('keyup', e=>{ keys[e.code]=false; });

//RESET
function resetGame(){
    game.player1.health=100;
    game.player2.health=100;
    game.player1.punching=false;
    game.player2.punching=false;
    game.player1.punchX=0;
    game.player2.punchX=0;
    game.player1.punchTime=0;
    game.player2.punchTime=0;
    game.player1.x=50;
    game.player2.x=650;
    game.player1.y=GROUND_Y;
    game.player2.y=GROUND_Y;
    game.player1.velocityX=0; 
    game.player1.velocityY=0;
    game.player2.velocityX=0;
    game.player2.velocityY=0;
    game.player1.jumping=false; game.player2.jumping=false;
    hitCooldown1=0;
    hitCooldown2=0;
    updateHealth();
    gameOverEl.style.display='none';
    requestAnimationFrame(gameLoop);
}