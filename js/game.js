//COLORS
var Colors = {
  red: 0xf25346,
  white: 0xd8d0d1,
  brown: 0x59332e,
  brownDark: 0x23190f,
  pink: 0xf5986e,
  yellow: 0xf4ce93,
  blue: 0x68c3c0,
  black: 0x000000,
  beeYellow: 0xffc700,
  beeBlack: 0x000000,
  lightYellow: 0xffed7f,
  cheekPink: 0xff9999,
  // Super Helpers theme colors
  flowerBlue: 0x4086ff,
  flowerPink: 0xff86c0,
  flowerStem: 0x4caf50,
  flowerYellow: 0xffeb3b,
  // Picture book scene colors
  grassGreen: 0x7cba6c, // Green grass
  treeBark: 0x8b5a2b, // Tree bark brown
  leafGreen: 0x4caf50, // Leaf green
  // Rhododendron colors
  rhododendronPink: 0xff1493, // Rhododendron pink
  rhododendronPurple: 0x8a2be2, // Rhododendron purple
  rhododendronLeaf: 0x006400, // Rhododendron leaf dark green
};

// Audio object
var Audio = {
  backgroundMusic: null,
  collectSound: null,
  dangerSound: null,
  initialized: false,
  muted: false,

  // Initialize audio
  init: function () {
    if (this.initialized) return;

    // Load user audio preferences
    if (typeof Storage !== 'undefined') {
      var savedMuted = localStorage.getItem('gameMuted');
      if (savedMuted !== null) {
        this.muted = savedMuted === 'true';
      }
    }

    // Create audio objects
    this.backgroundMusic = new Howl({
      src: ['./audio/background-music.mp3'],
      loop: true,
      volume: 0.5,
      autoplay: false,
    });

    this.collectSound = new Howl({
      src: ['./audio/collect-sound.mp3'],
      volume: 0.7,
      autoplay: false,
    });

    this.dangerSound = new Howl({
      src: ['./audio/danger-sound.mp3'],
      volume: 0.6, // Lower volume to make the alert sound less jarring
      sprite: {
        main: [0, 2000], // Only play the first 2 seconds
        alt: [0, 800], // Alternative sound only plays the first 0.8 seconds
      },
      autoplay: false,
    });

    // Apply mute settings
    Howler.mute(this.muted);

    // Setup audio controls
    this.setupAudioControls();

    this.initialized = true;
  },

  // Setup audio controls
  setupAudioControls: function () {
    var toggleAudioBtn = document.getElementById('toggleAudio');

    if (toggleAudioBtn) {
      var audioIcon = toggleAudioBtn.querySelector('.audio-icon');

      // Make sure button displays the correct icon
      if (audioIcon) {
        audioIcon.textContent = this.muted ? '🔇' : '🔊';
      }

      toggleAudioBtn.addEventListener('click', function () {
        Audio.toggleMute();
        audioIcon.textContent = Audio.muted ? '🔇' : '🔊';
      });
    }
  },

  // Toggle mute state
  toggleMute: function () {
    this.muted = !this.muted;
    Howler.mute(this.muted);

    // Save user preferences
    if (typeof Storage !== 'undefined') {
      localStorage.setItem('gameMuted', this.muted);
    }

    return this.muted;
  },

  // Play background music
  playBackgroundMusic: function () {
    if (!this.initialized) this.init();
    if (!this.backgroundMusic.playing()) {
      this.backgroundMusic.play();
    }
  },

  // Pause background music
  pauseBackgroundMusic: function () {
    if (this.initialized && this.backgroundMusic.playing()) {
      this.backgroundMusic.pause();
    }
  },

  // Play collection sound effect
  playCollectSound: function () {
    if (!this.initialized) this.init();
    this.collectSound.play();
  },

  // Play danger sound effect
  playDangerSound: function () {
    if (!this.initialized) this.init();
    // Randomly choose main or alternative sound effect for variety
    var sound = Math.random() > 0.5 ? 'main' : 'alt';
    this.dangerSound.play(sound);
  },
};

///////////////

// GAME VARIABLES
var game;
var deltaTime = 0;
var newTime = new Date().getTime();
var oldTime = new Date().getTime();
var ennemiesPool = [];
var particlesPool = [];
var particlesInUse = [];

// DOM elements
var fieldLevel;
var fieldDistance;
var energyBar;
var replayMessage;
var fieldGameOver;
var fieldGameOverStats;
var levelCircle;

// 3D Objects
var sea;
var airplane;
var sky;
var coinsHolder;
var ennemiesHolder;
var particlesHolder;

function resetGame() {
  game = {
    speed: 0,
    initSpeed: 0.00035,
    baseSpeed: 0.00035,
    targetBaseSpeed: 0.00035,
    incrementSpeedByTime: 0.0000025,
    incrementSpeedByLevel: 0.000005,
    distanceForSpeedUpdate: 100,
    speedLastUpdate: 0,

    distance: 0,
    ratioSpeedDistance: 50,
    energy: 100,
    ratioSpeedEnergy: 3,

    level: 1,
    levelLastUpdate: 0,
    distanceForLevelUpdate: 1000,

    planeDefaultHeight: 100,
    planeAmpHeight: 80,
    planeAmpWidth: 75,
    planeMoveSensivity: 0.005,
    planeRotXSensivity: 0.0008,
    planeRotZSensivity: 0.0004,
    planeFallSpeed: 0.001,
    planeMinSpeed: 1.2,
    planeMaxSpeed: 1.6,
    planeSpeed: 0,
    planeCollisionDisplacementX: 0,
    planeCollisionSpeedX: 0,

    planeCollisionDisplacementY: 0,
    planeCollisionSpeedY: 0,

    seaRadius: 600,
    seaLength: 800,
    //seaRotationSpeed:0.006,
    wavesMinAmp: 5,
    wavesMaxAmp: 20,
    wavesMinSpeed: 0.001,
    wavesMaxSpeed: 0.003,

    cameraFarPos: 500,
    cameraNearPos: 150,
    cameraSensivity: 0.002,

    coinDistanceTolerance: 15,
    coinValue: 3,
    coinsSpeed: 0.5,
    coinLastSpawn: 0,
    distanceForCoinsSpawn: 100,

    ennemyDistanceTolerance: 10,
    ennemyValue: 10,
    ennemiesSpeed: 0.6,
    ennemyLastSpawn: 0,
    distanceForEnnemiesSpawn: 50,

    status: 'playing',
  };
  fieldLevel.innerHTML = Math.floor(game.level);

  // Restart background music
  if (Audio.initialized) {
    Audio.playBackgroundMusic();
  }
}

//THREEJS RELATED VARIABLES

var scene,
  camera,
  fieldOfView,
  aspectRatio,
  nearPlane,
  farPlane,
  renderer,
  container,
  controls;

//SCREEN & MOUSE VARIABLES

var HEIGHT,
  WIDTH,
  mousePos = { x: 0, y: 0 };

// Pointer lock variables
var isPointerLocked = false;
var pointerLockSupported =
  'pointerLockElement' in document ||
  'mozPointerLockElement' in document ||
  'webkitPointerLockElement' in document;

//INIT THREE JS, SCREEN AND MOUSE EVENTS

function createScene() {
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;

  scene = new THREE.Scene();
  aspectRatio = WIDTH / HEIGHT;
  fieldOfView = 50;
  nearPlane = 0.1;
  farPlane = 10000;
  camera = new THREE.PerspectiveCamera(
    fieldOfView,
    aspectRatio,
    nearPlane,
    farPlane
  );
  scene.fog = new THREE.Fog(0xf7d9aa, 100, 950);
  camera.position.x = 0;
  camera.position.z = 200;
  camera.position.y = game.planeDefaultHeight;
  //camera.lookAt(new THREE.Vector3(0, 400, 0));

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(WIDTH, HEIGHT);

  renderer.shadowMap.enabled = true;

  container = document.getElementById('world');
  container.appendChild(renderer.domElement);

  window.addEventListener('resize', handleWindowResize, false);

  /*
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.minPolarAngle = -Math.PI / 2;
  controls.maxPolarAngle = Math.PI ;

  //controls.noZoom = true;
  //controls.noPan = true;
  //*/
}

// MOUSE AND SCREEN EVENTS

function handleWindowResize() {
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;
  renderer.setSize(WIDTH, HEIGHT);
  camera.aspect = WIDTH / HEIGHT;
  camera.updateProjectionMatrix();
}

function handleMouseMove(event) {
  if (isPointerLocked) {
    // In pointer lock mode, use movementX/Y which gives relative motion
    const movementX =
      event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    const movementY =
      event.movementY || event.mozMovementY || event.webkitMovementY || 0;

    // Adjust sensitivity based on device pixel ratio for consistent feel across devices
    const sensitivity = 0.0015 * (window.devicePixelRatio || 1);

    // Update mouse position with delta movement
    mousePos.x += movementX * sensitivity;
    mousePos.y -= movementY * sensitivity; // Invert Y for natural feel

    // Clamp values to stay within bounds
    mousePos.x = Math.max(-1, Math.min(1, mousePos.x));
    mousePos.y = Math.max(-1, Math.min(1, mousePos.y));
  } else {
    // Original behavior for non-locked pointer
    var tx = -1 + (event.clientX / WIDTH) * 2;
    var ty = 1 - (event.clientY / HEIGHT) * 2;
    mousePos = { x: tx, y: ty };
  }
}

function handleTouchMove(event) {
  event.preventDefault();
  var tx = -1 + (event.touches[0].pageX / WIDTH) * 2;
  var ty = 1 - (event.touches[0].pageY / HEIGHT) * 2;
  mousePos = { x: tx, y: ty };
}

function handleMouseUp(event) {
  if (game.status == 'waitingReplay') {
    resetGame();
    hideReplay();
  } else if (game.status == 'playing' && !isPointerLocked) {
    // Lock pointer when clicking on the world during gameplay
    lockPointer();
  }
}

function handleTouchEnd(event) {
  if (game.status == 'waitingReplay') {
    resetGame();
    hideReplay();
  }
}

// LIGHTS

var ambientLight, hemisphereLight, shadowLight;

function createLights() {
  hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, 0.9);

  ambientLight = new THREE.AmbientLight(0xdc8874, 0.5);

  shadowLight = new THREE.DirectionalLight(0xffffff, 0.9);
  shadowLight.position.set(150, 350, 350);
  shadowLight.castShadow = true;
  shadowLight.shadow.camera.left = -400;
  shadowLight.shadow.camera.right = 400;
  shadowLight.shadow.camera.top = 400;
  shadowLight.shadow.camera.bottom = -400;
  shadowLight.shadow.camera.near = 1;
  shadowLight.shadow.camera.far = 1000;
  shadowLight.shadow.mapSize.width = 4096;
  shadowLight.shadow.mapSize.height = 4096;

  var ch = new THREE.CameraHelper(shadowLight.shadow.camera);

  //scene.add(ch);
  scene.add(hemisphereLight);
  scene.add(shadowLight);
  scene.add(ambientLight);
}

var Pilot = function () {
  this.mesh = new THREE.Object3D();
  this.mesh.name = 'pilot';
  this.angleHairs = 0;

  var bodyGeom = new THREE.BoxGeometry(15, 15, 15);
  var bodyMat = new THREE.MeshPhongMaterial({
    color: Colors.brown,
    flatShading: true,
  });
  var body = new THREE.Mesh(bodyGeom, bodyMat);
  body.position.set(2, -12, 0);

  this.mesh.add(body);

  var faceGeom = new THREE.BoxGeometry(10, 10, 10);
  var faceMat = new THREE.MeshLambertMaterial({ color: Colors.pink });
  var face = new THREE.Mesh(faceGeom, faceMat);
  this.mesh.add(face);

  // Add a yellow hat - larger and more visible
  var hatGeom = new THREE.CylinderGeometry(8, 10, 8, 8);
  var hatMat = new THREE.MeshPhongMaterial({
    color: 0xffdd00, // Brighter yellow
    flatShading: true,
    shininess: 30, // Add more shine
  });
  var hat = new THREE.Mesh(hatGeom, hatMat);
  hat.position.y = 10; // Higher position
  hat.position.x = 0;
  hat.position.z = 0;
  hat.rotation.x = Math.PI * 0.05; // Tilted slightly forward
  this.mesh.add(hat);

  // Add larger hat brim
  var brimGeom = new THREE.CylinderGeometry(11, 11, 1.5, 8);
  var brimMat = new THREE.MeshPhongMaterial({
    color: 0xffdd00, // Matching hat color
    flatShading: true,
  });
  var brim = new THREE.Mesh(brimGeom, brimMat);
  brim.position.y = 6; // Bottom of hat
  brim.position.x = 0;
  brim.position.z = 0;
  this.mesh.add(brim);

  // Add striking hat decoration band
  var bandGeom = new THREE.CylinderGeometry(8.1, 8.1, 2, 8);
  var bandMat = new THREE.MeshPhongMaterial({
    color: Colors.beeBlack, // Black decorative band
    flatShading: true,
  });
  var band = new THREE.Mesh(bandGeom, bandMat);
  band.position.y = 8; // Middle of hat
  this.mesh.add(band);

  // Add hat top decoration
  var topDecorGeom = new THREE.SphereGeometry(2, 8, 8);
  var topDecorMat = new THREE.MeshPhongMaterial({
    color: 0xffdd00, // Matching hat color
    flatShading: false,
    shininess: 60, // High shine
  });
  var topDecor = new THREE.Mesh(topDecorGeom, topDecorMat);
  topDecor.position.y = 14; // Top of hat
  topDecor.position.x = 0;
  topDecor.position.z = 0;
  this.mesh.add(topDecor);

  var hairGeom = new THREE.BoxGeometry(4, 4, 4);
  var hairMat = new THREE.MeshLambertMaterial({ color: Colors.brown });
  var hair = new THREE.Mesh(hairGeom, hairMat);
  hair.geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 2, 0));
  var hairs = new THREE.Object3D();

  this.hairsTop = new THREE.Object3D();

  for (var i = 0; i < 12; i++) {
    var h = hair.clone();
    var col = i % 3;
    var row = Math.floor(i / 3);
    var startPosZ = -4;
    var startPosX = -4;
    h.position.set(startPosX + row * 4, 0, startPosZ + col * 4);
    h.geometry.applyMatrix4(new THREE.Matrix4().makeScale(1, 1, 1));
    this.hairsTop.add(h);
  }
  hairs.add(this.hairsTop);

  var hairSideGeom = new THREE.BoxGeometry(12, 4, 2);
  hairSideGeom.applyMatrix4(new THREE.Matrix4().makeTranslation(-6, 0, 0));
  var hairSideR = new THREE.Mesh(hairSideGeom, hairMat);
  var hairSideL = hairSideR.clone();
  hairSideR.position.set(8, -2, 6);
  hairSideL.position.set(8, -2, -6);
  hairs.add(hairSideR);
  hairs.add(hairSideL);

  var hairBackGeom = new THREE.BoxGeometry(2, 8, 10);
  var hairBack = new THREE.Mesh(hairBackGeom, hairMat);
  hairBack.position.set(-1, -4, 0);
  hairs.add(hairBack);
  hairs.position.set(-5, 5, 0);

  this.mesh.add(hairs);

  var glassGeom = new THREE.BoxGeometry(5, 5, 5);
  var glassMat = new THREE.MeshLambertMaterial({ color: Colors.brown });
  var glassR = new THREE.Mesh(glassGeom, glassMat);
  glassR.position.set(6, 0, 3);
  var glassL = glassR.clone();
  glassL.position.z = -glassR.position.z;

  var glassAGeom = new THREE.BoxGeometry(11, 1, 11);
  var glassA = new THREE.Mesh(glassAGeom, glassMat);
  this.mesh.add(glassR);
  this.mesh.add(glassL);
  this.mesh.add(glassA);

  var earGeom = new THREE.BoxGeometry(2, 3, 2);
  var earL = new THREE.Mesh(earGeom, faceMat);
  earL.position.set(0, 0, -6);
  var earR = earL.clone();
  earR.position.set(0, 0, 6);
  this.mesh.add(earL);
  this.mesh.add(earR);
};

Pilot.prototype.updateHairs = function () {
  //*
  var hairs = this.hairsTop.children;

  var l = hairs.length;
  for (var i = 0; i < l; i++) {
    var h = hairs[i];
    h.scale.y = 0.75 + Math.cos(this.angleHairs + i / 3) * 0.25;
  }
  this.angleHairs += game.speed * deltaTime * 40;
  //*/
};

var AirPlane = function () {
  this.mesh = new THREE.Object3D();
  this.mesh.name = 'airPlane';

  // Always create bee model
  this.createBeeModel();

  this.pilot = new Pilot();
  this.pilot.mesh.position.set(-10, 27, 0);
  this.mesh.add(this.pilot.mesh);

  this.mesh.castShadow = true;
  this.mesh.receiveShadow = true;
};

// Create bee model (strictly follow reference image)
AirPlane.prototype.createBeeModel = function () {
  // Color definitions
  Colors.beeYellow = 0xffe066; // Bright yellow
  Colors.beeBlack = 0x222222; // Deep black
  Colors.beeOrange = 0xffb13b; // Orange stripes
  Colors.cheekPink = 0xffb6b6; // Pink
  Colors.eyeBlack = 0x222222;
  Colors.eyeHighlight = 0xffffff;
  Colors.wingWhite = 0xffffff;
  Colors.wingBlue = 0xb3e6ff;

  // Main body parameters
  const bodyRadius = 22;
  const beeGroup = new THREE.Object3D();
  this.mesh.add(beeGroup);

  // --- Body sphere ---
  const bodyGeom = new THREE.SphereGeometry(bodyRadius, 48, 48);
  const bodyMat = new THREE.MeshPhongMaterial({
    color: Colors.beeYellow,
    shininess: 40,
  });
  const body = new THREE.Mesh(bodyGeom, bodyMat);
  beeGroup.add(body);

  // --- Black wide rings ---
  // Front black ring
  const frontRingGeom = new THREE.TorusGeometry(
    bodyRadius * 0.98,
    bodyRadius * 0.22,
    24,
    64
  );
  const ringMat = new THREE.MeshPhongMaterial({
    color: Colors.beeBlack,
    shininess: 10,
  });
  const frontRing = new THREE.Mesh(frontRingGeom, ringMat);
  frontRing.rotation.y = Math.PI / 2;
  frontRing.position.x = bodyRadius * 0.18;
  beeGroup.add(frontRing);
  // Back black ring
  const backRing = frontRing.clone();
  backRing.position.x = -bodyRadius * 0.18;
  beeGroup.add(backRing);

  // --- Orange stripes ---
  const orangeRingGeom = new THREE.TorusGeometry(
    bodyRadius * 0.98,
    bodyRadius * 0.18,
    24,
    64
  );
  const orangeMat = new THREE.MeshPhongMaterial({
    color: Colors.beeOrange,
    shininess: 10,
  });
  const orangeRing = new THREE.Mesh(orangeRingGeom, orangeMat);
  orangeRing.rotation.y = Math.PI / 2;
  beeGroup.add(orangeRing);

  // --- Eyes ---
  const eyeRadius = bodyRadius * 0.19;
  const eyeGeom = new THREE.SphereGeometry(eyeRadius, 24, 24);
  eyeGeom.scale(1, 1.35, 1); // Oval shape
  const eyeMat = new THREE.MeshPhongMaterial({
    color: Colors.eyeBlack,
    shininess: 80,
  });
  // Left eye
  const eyeL = new THREE.Mesh(eyeGeom, eyeMat);
  eyeL.position.set(bodyRadius * 0.82, bodyRadius * 0.18, bodyRadius * 0.48);
  beeGroup.add(eyeL);
  // Right eye
  const eyeR = eyeL.clone();
  eyeR.position.z = -eyeL.position.z;
  beeGroup.add(eyeR);
  // Eye highlight
  const highlightGeom = new THREE.SphereGeometry(eyeRadius * 0.32, 12, 12);
  const highlightMat = new THREE.MeshBasicMaterial({
    color: Colors.eyeHighlight,
  });
  const highlightL = new THREE.Mesh(highlightGeom, highlightMat);
  highlightL.position.set(eyeRadius * 0.4, eyeRadius * 0.3, eyeRadius * 0.2);
  eyeL.add(highlightL);
  const highlightR = highlightL.clone();
  eyeR.add(highlightR);

  // --- Smile ---
  const smileCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(bodyRadius * 0.18, -bodyRadius * 0.18, bodyRadius * 0.18),
    new THREE.Vector3(bodyRadius * 0.32, -bodyRadius * 0.28, 0),
    new THREE.Vector3(
      bodyRadius * 0.18,
      -bodyRadius * 0.18,
      -bodyRadius * 0.18
    ),
  ]);
  const smileGeom = new THREE.TubeGeometry(
    smileCurve,
    16,
    bodyRadius * 0.04,
    8,
    false
  );
  const smileMat = new THREE.MeshBasicMaterial({ color: Colors.eyeBlack });
  const smile = new THREE.Mesh(smileGeom, smileMat);
  smile.position.x = bodyRadius * 0.7;
  beeGroup.add(smile);

  // --- Cheek ---
  const cheekGeom = new THREE.SphereGeometry(bodyRadius * 0.13, 16, 16);
  const cheekMat = new THREE.MeshPhongMaterial({
    color: Colors.cheekPink,
    transparent: true,
    opacity: 0.7,
  });
  const cheekL = new THREE.Mesh(cheekGeom, cheekMat);
  cheekL.position.set(bodyRadius * 0.7, -bodyRadius * 0.18, bodyRadius * 0.38);
  beeGroup.add(cheekL);
  const cheekR = cheekL.clone();
  cheekR.position.z = -cheekL.position.z;
  beeGroup.add(cheekR);

  // --- Antenna ---
  const antennaRadius = bodyRadius * 0.06;
  const antennaLength = bodyRadius * 0.95;
  // Curve
  const antennaCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(antennaLength * 0.18, antennaLength * 0.5, 0),
    new THREE.Vector3(antennaLength * 0.18, antennaLength * 0.9, 0),
    new THREE.Vector3(0, antennaLength, 0),
  ]);
  const antennaGeom = new THREE.TubeGeometry(
    antennaCurve,
    16,
    antennaRadius * 0.45,
    8,
    false
  );
  const antennaMat = new THREE.MeshPhongMaterial({ color: Colors.beeBlack });
  // Left antenna
  const antennaLGroup = new THREE.Object3D();
  const antennaL = new THREE.Mesh(antennaGeom, antennaMat);
  const antennaBallL = new THREE.Mesh(
    new THREE.SphereGeometry(antennaRadius, 16, 16),
    antennaMat
  );
  antennaBallL.position.copy(
    antennaCurve.points[antennaCurve.points.length - 1]
  );
  antennaLGroup.add(antennaL);
  antennaLGroup.add(antennaBallL);
  antennaLGroup.position.set(
    bodyRadius * 0.45,
    bodyRadius * 0.85,
    bodyRadius * 0.32
  );
  beeGroup.add(antennaLGroup);
  // Right antenna
  const antennaRGroup = antennaLGroup.clone();
  antennaRGroup.position.z = -antennaLGroup.position.z;
  beeGroup.add(antennaRGroup);

  // --- Wings ---
  const wingShape = new THREE.Shape();
  const wingW = bodyRadius * 1.4; // Wider
  const wingH = bodyRadius * 2.0; // Taller
  wingShape.ellipse(0, 0, wingW, wingH, 0, Math.PI * 2);
  const wingGeom = new THREE.ShapeGeometry(wingShape);
  const wingMat = new THREE.MeshPhongMaterial({
    color: Colors.wingWhite,
    transparent: true,
    opacity: 0.75, // Increased opacity
    shininess: 100,
    side: THREE.DoubleSide,
  });
  // Left main wing
  const wingL = new THREE.Mesh(wingGeom, wingMat);
  wingL.position.set(-bodyRadius * 0.1, bodyRadius * 1.3, bodyRadius * 1.05); // Adjusted position
  wingL.rotation.x = -Math.PI / 2.3;
  wingL.rotation.y = Math.PI / 5;
  wingL.scale.set(0.45, 0.45, 0.45); // Larger wings
  beeGroup.add(wingL);
  // Blue highlight
  const wingHLGeom = new THREE.CircleGeometry(wingW * 0.25, 16);
  const wingHLMat = new THREE.MeshBasicMaterial({
    color: Colors.wingBlue,
    transparent: true,
    opacity: 0.6, // Increased opacity
  });
  const wingHL = new THREE.Mesh(wingHLGeom, wingHLMat);
  wingHL.position.set(wingW * 0.2, wingH * 0.2, 0.1);
  wingL.add(wingHL);
  // Right main wing
  const wingR = wingL.clone();
  wingR.position.z = -wingL.position.z;
  wingR.rotation.y = -wingL.rotation.y;
  beeGroup.add(wingR);
  // Animation references
  this.wings = { left: [wingL], right: [wingR] };
  this.antennaLGroup = antennaLGroup;
  this.antennaRGroup = antennaRGroup;
  this.body = body;
  // Animation parameters
  this.wingsRotation = 0;
  this.bouncingValue = 0;
};

// Bee animation (gentle)
AirPlane.prototype.updateWings = function () {
  if (!window.isBeeMode) return;
  this.wingsRotation += 0.8; // Faster wing flapping speed

  // Get wing base position
  const bodyRadius = 22;
  const baseYPos = bodyRadius * 1.3;

  // Wing flapping - increase swing amplitude, but reset base position each frame to avoid drift
  if (this.wings && this.wings.left && this.wings.left[0]) {
    const wingL = this.wings.left[0];

    // Reset to base position
    wingL.position.set(-bodyRadius * 0.1, baseYPos, bodyRadius * 1.05);

    // Apply rotation - more exaggerated animation effects
    wingL.rotation.z = Math.sin(this.wingsRotation) * 0.65;
    wingL.rotation.x =
      -Math.PI / 2.3 + Math.cos(this.wingsRotation * 0.5) * 0.2;
    wingL.rotation.y = Math.PI / 5 + Math.sin(this.wingsRotation * 0.7) * 0.1;

    // Add position changes, relative to base position
    wingL.position.y += Math.sin(this.wingsRotation) * 2.0;
  }

  if (this.wings && this.wings.right && this.wings.right[0]) {
    const wingR = this.wings.right[0];

    // Reset to base position
    wingR.position.set(-bodyRadius * 0.1, baseYPos, -bodyRadius * 1.05);

    // Apply rotation - more exaggerated animation effects
    wingR.rotation.z = Math.sin(this.wingsRotation) * 0.65;
    wingR.rotation.x =
      -Math.PI / 2.3 + Math.cos(this.wingsRotation * 0.5) * 0.2;
    wingR.rotation.y = -Math.PI / 5 - Math.sin(this.wingsRotation * 0.7) * 0.1;

    // Add position changes, relative to base position
    wingR.position.y += Math.sin(this.wingsRotation) * 2.0;
  }

  // Body floating animation
  this.bouncingValue += 0.03;
  this.mesh.position.y += Math.sin(this.bouncingValue) * 0.08;

  // Antenna animation
  if (this.antennaLGroup && this.antennaRGroup) {
    const wiggle = 0.15; // Increased antenna swing amplitude
    this.antennaLGroup.rotation.x =
      -Math.PI / 8 + Math.sin(this.bouncingValue * 1.2) * wiggle;
    this.antennaRGroup.rotation.x =
      -Math.PI / 8 + Math.sin(this.bouncingValue * 1.2 + Math.PI / 2) * wiggle;
  }
};

var Sky = function () {
  this.mesh = new THREE.Object3D();
  this.nClouds = 20;
  this.clouds = [];
  var stepAngle = (Math.PI * 2) / this.nClouds;
  for (var i = 0; i < this.nClouds; i++) {
    var c = new Cloud();
    this.clouds.push(c);
    var a = stepAngle * i;
    var h = game.seaRadius + 150 + Math.random() * 200;
    c.mesh.position.y = Math.sin(a) * h;
    c.mesh.position.x = Math.cos(a) * h;
    c.mesh.position.z = -300 - Math.random() * 500;
    c.mesh.rotation.z = a + Math.PI / 2;
    var s = 1 + Math.random() * 2;
    c.mesh.scale.set(s, s, s);
    this.mesh.add(c.mesh);
  }
};

Sky.prototype.moveClouds = function () {
  for (var i = 0; i < this.nClouds; i++) {
    var c = this.clouds[i];
    c.rotate();
  }
  this.mesh.rotation.z += game.speed * deltaTime;
};

var Sea = function () {
  var geom = new THREE.CylinderGeometry(
    game.seaRadius,
    game.seaRadius,
    game.seaLength,
    40,
    10
  );
  geom.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
  geom.computeVertexNormals();

  // Extract vertex positions manually to create waves array
  const positionAttribute = geom.getAttribute('position');
  const vertices = [];
  for (let i = 0; i < positionAttribute.count; i++) {
    vertices.push({
      x: positionAttribute.getX(i),
      y: positionAttribute.getY(i),
      z: positionAttribute.getZ(i),
      ang: Math.random() * Math.PI * 2,
      amp:
        game.wavesMinAmp +
        Math.random() * (game.wavesMaxAmp - game.wavesMinAmp),
      speed:
        game.wavesMinSpeed +
        Math.random() * (game.wavesMaxSpeed - game.wavesMinSpeed),
    });
  }

  this.waves = vertices;

  // Modified to green ground - using more vibrant green
  var mat = new THREE.MeshPhongMaterial({
    color: 0x4caf50, // More vibrant green
    transparent: false,
    flatShading: true,
  });

  this.mesh = new THREE.Mesh(geom, mat);
  this.mesh.name = 'ground';
  this.mesh.receiveShadow = true;
};

Sea.prototype.moveWaves = function () {
  const positionAttribute = this.mesh.geometry.getAttribute('position');

  for (let i = 0; i < this.waves.length; i++) {
    const vprops = this.waves[i];
    const x = vprops.x + Math.cos(vprops.ang) * vprops.amp;
    const y = vprops.y + Math.sin(vprops.ang) * vprops.amp;

    positionAttribute.setXY(i, x, y);
    vprops.ang += vprops.speed * deltaTime;
  }

  positionAttribute.needsUpdate = true;
  this.mesh.geometry.computeVertexNormals();
};

var Cloud = function () {
  this.mesh = new THREE.Object3D();
  this.mesh.name = 'cloud';

  // Use spheres instead of cubes to create a softer appearance
  var geom = new THREE.SphereGeometry(15, 12, 12); // Increase subdivision count for smoother spheres
  var mat = new THREE.MeshPhongMaterial({
    color: Colors.white,
    transparent: true,
    opacity: 0.6, // Reduce opacity to make it more ethereal
    flatShading: false,
    shininess: 0,
  });

  // Create the main part of the cloud
  var nBlocs = 3 + Math.floor(Math.random() * 4); // Add more spheres
  for (var i = 0; i < nBlocs; i++) {
    var m = new THREE.Mesh(geom.clone(), mat);

    // More natural distribution
    var angle = (i / nBlocs) * Math.PI * 2;
    var radius = 7 + Math.random() * 7; // Larger distribution range
    m.position.x = Math.cos(angle) * radius;
    m.position.y = Math.sin(angle) * radius * 0.5;
    m.position.z = Math.random() * 7 - 3.5; // More varied front-back distribution

    // Various sizes of spheres
    var s = 0.3 + Math.random() * 0.6;
    m.scale.set(
      s * (1.2 + Math.random() * 0.3),
      s * (0.7 + Math.random() * 0.3),
      s * (1.2 + Math.random() * 0.3)
    );

    m.rotation.z = Math.random() * Math.PI * 2;
    m.rotation.y = Math.random() * Math.PI * 2;

    // Store original position for animation
    m.originalX = m.position.x;
    m.originalY = m.position.y;
    m.originalZ = m.position.z;
    m.pulseSpeed = 0.5 + Math.random() * 0.8; // Different pulse speed for each part

    this.mesh.add(m);
    m.castShadow = true;
    m.receiveShadow = true;
  }

  // Add overall floating animation parameters
  this.angleX = Math.random() * Math.PI * 2;
  this.angleY = Math.random() * Math.PI * 2;
  this.angleZ = Math.random() * Math.PI * 2;
  this.speed = 0.5 + Math.random() * 0.5;
};

Cloud.prototype.rotate = function () {
  // Make cloud rotation smoother
  var time = Date.now() * 0.0001;

  // Overall slow cloud rotation
  this.angleX += 0.001 * this.speed;
  this.angleY += 0.0015 * this.speed;
  this.angleZ += 0.001 * this.speed;

  this.mesh.rotation.x = Math.sin(this.angleX) * 0.1;
  this.mesh.rotation.y = Math.sin(this.angleY) * 0.1;
  this.mesh.rotation.z = Math.sin(this.angleZ) * 0.1;

  var l = this.mesh.children.length;
  for (var i = 0; i < l; i++) {
    var m = this.mesh.children[i];

    // Independent subtle movement for each part
    if (m.originalY !== undefined) {
      // Slight horizontal sway
      m.position.x = m.originalX + Math.sin(time * m.pulseSpeed + i) * 0.8;
      // Slight vertical float
      m.position.y =
        m.originalY + Math.sin(time * m.pulseSpeed + i + Math.PI / 2) * 0.6;
      // Depth movement as well
      if (m.originalZ !== undefined) {
        m.position.z =
          m.originalZ + Math.sin(time * m.pulseSpeed * 0.7 + i) * 0.5;
      }

      // Slight rotation for each part
      m.rotation.x += 0.001 * (i + 1);
      m.rotation.y += 0.001 * (i + 1);
      m.rotation.z += 0.001 * (i + 1);
    }
  }
};

var Ennemy = function () {
  // Create rhododendron flowers as dangerous objects
  this.mesh = new THREE.Object3D();

  // Main flower - rhododendron blossom
  var flowerGeom = new THREE.SphereGeometry(7, 8, 8);
  var flowerMat = new THREE.MeshPhongMaterial({
    color: Colors.rhododendronPink,
    shininess: 5,
    specular: 0xffffff,
    flatShading: false,
  });
  var flower = new THREE.Mesh(flowerGeom, flowerMat);
  flower.scale.set(1, 0.8, 1);
  flower.castShadow = true;
  this.mesh.add(flower);

  // Create petals for the rhododendron flower
  var petalCount = 5;
  for (var i = 0; i < petalCount; i++) {
    var petalGeom = new THREE.TetrahedronGeometry(5, 0);
    var petalMat = new THREE.MeshPhongMaterial({
      color: Colors.rhododendronPurple,
      shininess: 0,
      flatShading: true,
    });
    var petal = new THREE.Mesh(petalGeom, petalMat);

    // Position petals in a circular pattern
    var angle = (Math.PI * 2 * i) / petalCount;
    var radius = 5;
    petal.position.x = Math.cos(angle) * radius;
    petal.position.z = Math.sin(angle) * radius;
    petal.position.y = 2;

    // Rotate petals outward
    petal.rotation.x = Math.PI / 4;
    petal.rotation.y = angle;

    this.mesh.add(petal);
  }

  // Add leaves
  var leafGeom = new THREE.TetrahedronGeometry(4, 1);
  var leafMat = new THREE.MeshPhongMaterial({
    color: Colors.rhododendronLeaf,
    shininess: 0,
    flatShading: true,
  });

  // Add multiple leaves around the base
  for (var i = 0; i < 3; i++) {
    var leaf = new THREE.Mesh(leafGeom, leafMat);
    var angle = (Math.PI * 2 * i) / 3;
    leaf.position.x = Math.cos(angle) * 5;
    leaf.position.z = Math.sin(angle) * 5;
    leaf.position.y = -5;
    leaf.rotation.x = -Math.PI / 4;
    leaf.rotation.y = angle;
    this.mesh.add(leaf);
  }

  // Add warning visual - slight glow effect to indicate danger
  var warningGeom = new THREE.SphereGeometry(9, 8, 8);
  var warningMat = new THREE.MeshPhongMaterial({
    color: Colors.rhododendronPink,
    transparent: true,
    opacity: 0.3,
    shininess: 10,
  });
  var warning = new THREE.Mesh(warningGeom, warningMat);
  this.mesh.add(warning);

  this.angle = 0;
  this.dist = 0;
};

var EnnemiesHolder = function () {
  this.mesh = new THREE.Object3D();
  this.ennemiesInUse = [];
};

EnnemiesHolder.prototype.spawnEnnemies = function () {
  var nEnnemies = game.level;

  for (var i = 0; i < nEnnemies; i++) {
    var ennemy;
    if (ennemiesPool.length) {
      ennemy = ennemiesPool.pop();
    } else {
      ennemy = new Ennemy();
    }

    ennemy.angle = -(i * 0.1);
    ennemy.distance =
      game.seaRadius +
      game.planeDefaultHeight +
      (-1 + Math.random() * 2) * (game.planeAmpHeight - 20);
    ennemy.mesh.position.y =
      -game.seaRadius + Math.sin(ennemy.angle) * ennemy.distance;
    ennemy.mesh.position.x = Math.cos(ennemy.angle) * ennemy.distance;

    this.mesh.add(ennemy.mesh);
    this.ennemiesInUse.push(ennemy);
  }
};

EnnemiesHolder.prototype.rotateEnnemies = function () {
  for (var i = 0; i < this.ennemiesInUse.length; i++) {
    var ennemy = this.ennemiesInUse[i];
    ennemy.angle += game.speed * deltaTime * game.ennemiesSpeed;

    if (ennemy.angle > Math.PI * 2) ennemy.angle -= Math.PI * 2;

    ennemy.mesh.position.y =
      -game.seaRadius + Math.sin(ennemy.angle) * ennemy.distance;
    ennemy.mesh.position.x = Math.cos(ennemy.angle) * ennemy.distance;
    ennemy.mesh.rotation.z += Math.random() * 0.1;
    ennemy.mesh.rotation.y += Math.random() * 0.1;

    //var globalEnnemyPosition =  ennemy.mesh.localToWorld(new THREE.Vector3());
    var diffPos = airplane.mesh.position
      .clone()
      .sub(ennemy.mesh.position.clone());
    var d = diffPos.length();
    if (d < game.ennemyDistanceTolerance) {
      particlesHolder.spawnParticles(
        ennemy.mesh.position.clone(),
        15,
        Colors.rhododendronPink, // Use rhododendron pink for particles to indicate danger
        3
      );

      ennemiesPool.unshift(this.ennemiesInUse.splice(i, 1)[0]);
      this.mesh.remove(ennemy.mesh);
      game.planeCollisionSpeedX = (100 * diffPos.x) / d;
      game.planeCollisionSpeedY = (100 * diffPos.y) / d;
      ambientLight.intensity = 2;

      removeEnergy();
      // Play danger sound effect
      Audio.playDangerSound();
      i--;
    } else if (ennemy.angle > Math.PI) {
      ennemiesPool.unshift(this.ennemiesInUse.splice(i, 1)[0]);
      this.mesh.remove(ennemy.mesh);
      i--;
    }
  }
};

var Particle = function () {
  var geom = new THREE.TetrahedronGeometry(3, 0);
  var mat = new THREE.MeshPhongMaterial({
    color: 0x009999,
    shininess: 0,
    specular: 0xffffff,
    flatShading: true,
  });
  this.mesh = new THREE.Mesh(geom, mat);
};

Particle.prototype.explode = function (pos, color, scale) {
  var _this = this;
  var _p = this.mesh.parent;
  this.mesh.material.color = new THREE.Color(color);
  this.mesh.material.needsUpdate = true;
  this.mesh.scale.set(scale, scale, scale);
  var targetX = pos.x + (-1 + Math.random() * 2) * 50;
  var targetY = pos.y + (-1 + Math.random() * 2) * 50;
  var speed = 0.6 + Math.random() * 0.2;
  TweenMax.to(this.mesh.rotation, speed, {
    x: Math.random() * 12,
    y: Math.random() * 12,
  });
  TweenMax.to(this.mesh.scale, speed, { x: 0.1, y: 0.1, z: 0.1 });
  TweenMax.to(this.mesh.position, speed, {
    x: targetX,
    y: targetY,
    delay: Math.random() * 0.1,
    ease: Power2.easeOut,
    onComplete: function () {
      if (_p) _p.remove(_this.mesh);
      _this.mesh.scale.set(1, 1, 1);
      particlesPool.unshift(_this);
    },
  });
};

var ParticlesHolder = function () {
  this.mesh = new THREE.Object3D();
  this.particlesInUse = [];
};

ParticlesHolder.prototype.spawnParticles = function (
  pos,
  density,
  color,
  scale
) {
  var nPArticles = density;
  for (var i = 0; i < nPArticles; i++) {
    var particle;
    if (particlesPool.length) {
      particle = particlesPool.pop();
    } else {
      particle = new Particle();
    }
    this.mesh.add(particle.mesh);
    particle.mesh.visible = true;
    var _this = this;
    particle.mesh.position.y = pos.y;
    particle.mesh.position.x = pos.x;
    particle.explode(pos, color, scale);
  }
};

var Coin = function () {
  // Create flower object instead of pill
  this.mesh = new THREE.Object3D();

  // Petals
  var petalGeom = new THREE.CircleGeometry(5, 8);
  var petalMat = new THREE.MeshPhongMaterial({
    color: Colors.flowerBlue,
    shininess: 10,
    flatShading: true,
  });

  // Create 8 petals around the center
  for (var i = 0; i < 8; i++) {
    var petal = new THREE.Mesh(petalGeom, petalMat);
    var angle = (i / 8) * Math.PI * 2;
    petal.position.x = Math.cos(angle) * 3;
    petal.position.z = Math.sin(angle) * 3;
    petal.rotation.x = Math.PI / 4;
    petal.rotation.y = angle;
    this.mesh.add(petal);
  }

  // Flower center
  var centerGeom = new THREE.SphereGeometry(2.5, 8, 8);
  var centerMat = new THREE.MeshPhongMaterial({
    color: Colors.flowerYellow,
    shininess: 10,
    flatShading: false,
  });
  var center = new THREE.Mesh(centerGeom, centerMat);
  this.mesh.add(center);

  this.mesh.castShadow = true;
  this.mesh.receiveShadow = true;
  this.angle = 0;
  this.dist = 0;
};

var CoinsHolder = function (nCoins) {
  this.mesh = new THREE.Object3D();
  this.coinsInUse = [];
  this.coinsPool = [];
  for (var i = 0; i < nCoins; i++) {
    var coin = new Coin();
    this.coinsPool.push(coin);
  }
};

CoinsHolder.prototype.spawnCoins = function () {
  var nCoins = 1 + Math.floor(Math.random() * 10);
  var d =
    game.seaRadius +
    game.planeDefaultHeight +
    (-1 + Math.random() * 2) * (game.planeAmpHeight - 20);
  var amplitude = 10 + Math.round(Math.random() * 10);
  for (var i = 0; i < nCoins; i++) {
    var coin;
    if (this.coinsPool.length) {
      coin = this.coinsPool.pop();
    } else {
      coin = new Coin();
    }
    this.mesh.add(coin.mesh);
    this.coinsInUse.push(coin);
    coin.angle = -(i * 0.02);
    coin.distance = d + Math.cos(i * 0.5) * amplitude;
    coin.mesh.position.y =
      -game.seaRadius + Math.sin(coin.angle) * coin.distance;
    coin.mesh.position.x = Math.cos(coin.angle) * coin.distance;
  }
};

CoinsHolder.prototype.rotateCoins = function () {
  for (var i = 0; i < this.coinsInUse.length; i++) {
    var coin = this.coinsInUse[i];
    if (coin.exploding) continue;
    coin.angle += game.speed * deltaTime * game.coinsSpeed;
    if (coin.angle > Math.PI * 2) coin.angle -= Math.PI * 2;
    coin.mesh.position.y =
      -game.seaRadius + Math.sin(coin.angle) * coin.distance;
    coin.mesh.position.x = Math.cos(coin.angle) * coin.distance;
    coin.mesh.rotation.z += Math.random() * 0.1;
    coin.mesh.rotation.y += Math.random() * 0.1;

    //var globalCoinPosition =  coin.mesh.localToWorld(new THREE.Vector3());
    var diffPos = airplane.mesh.position
      .clone()
      .sub(coin.mesh.position.clone());
    var d = diffPos.length();
    if (d < game.coinDistanceTolerance) {
      this.coinsPool.unshift(this.coinsInUse.splice(i, 1)[0]);
      this.mesh.remove(coin.mesh);
      particlesHolder.spawnParticles(
        coin.mesh.position.clone(),
        5,
        Colors.flowerBlue,
        0.8
      );
      addEnergy();
      // Play collection sound effect
      Audio.playCollectSound();
      i--;
    } else if (coin.angle > Math.PI) {
      this.coinsPool.unshift(this.coinsInUse.splice(i, 1)[0]);
      this.mesh.remove(coin.mesh);
      i--;
    }
  }
};

// 3D Models
var sea;
var airplane;

function createPlane() {
  airplane = new AirPlane();
  airplane.mesh.scale.set(0.25, 0.25, 0.25);
  airplane.mesh.position.y = game.planeDefaultHeight;
  scene.add(airplane.mesh);
}

function createSea() {
  sea = new Sea();
  sea.mesh.position.y = -game.seaRadius;
  scene.add(sea.mesh);
}

function createSky() {
  sky = new Sky();
  sky.mesh.position.y = -game.seaRadius;
  scene.add(sky.mesh);
}

function createCoins() {
  coinsHolder = new CoinsHolder(20);
  scene.add(coinsHolder.mesh);
}

function createEnnemies() {
  for (var i = 0; i < 10; i++) {
    var ennemy = new Ennemy();
    ennemiesPool.push(ennemy);
  }
  ennemiesHolder = new EnnemiesHolder();
  //ennemiesHolder.mesh.position.y = -game.seaRadius;
  scene.add(ennemiesHolder.mesh);
}

function createParticles() {
  for (var i = 0; i < 10; i++) {
    var particle = new Particle();
    particlesPool.push(particle);
  }
  particlesHolder = new ParticlesHolder();
  //ennemiesHolder.mesh.position.y = -game.seaRadius;
  scene.add(particlesHolder.mesh);
}

function loop() {
  newTime = new Date().getTime();
  deltaTime = newTime - oldTime;
  oldTime = newTime;

  if (game.status == 'playing') {
    // Add energy coins every 100m;
    if (
      Math.floor(game.distance) % game.distanceForCoinsSpawn == 0 &&
      Math.floor(game.distance) > game.coinLastSpawn
    ) {
      game.coinLastSpawn = Math.floor(game.distance);
      coinsHolder.spawnCoins();
    }

    if (
      Math.floor(game.distance) % game.distanceForSpeedUpdate == 0 &&
      Math.floor(game.distance) > game.speedLastUpdate
    ) {
      game.speedLastUpdate = Math.floor(game.distance);
      game.targetBaseSpeed += game.incrementSpeedByTime * deltaTime;
    }

    if (
      Math.floor(game.distance) % game.distanceForEnnemiesSpawn == 0 &&
      Math.floor(game.distance) > game.ennemyLastSpawn
    ) {
      game.ennemyLastSpawn = Math.floor(game.distance);
      ennemiesHolder.spawnEnnemies();
    }

    if (
      Math.floor(game.distance) % game.distanceForLevelUpdate == 0 &&
      Math.floor(game.distance) > game.levelLastUpdate
    ) {
      game.levelLastUpdate = Math.floor(game.distance);
      game.level++;
      fieldLevel.innerHTML = Math.floor(game.level);

      game.targetBaseSpeed =
        game.initSpeed + game.incrementSpeedByLevel * game.level;
    }

    updatePlane();
    updateDistance();
    updateEnergy();
    game.baseSpeed +=
      (game.targetBaseSpeed - game.baseSpeed) * deltaTime * 0.02;
    game.speed = game.baseSpeed * game.planeSpeed;

    // Ensure background music is playing
    Audio.playBackgroundMusic();
  } else if (game.status == 'gameover') {
    // Unlock pointer when game is over
    if (isPointerLocked) {
      unlockPointer();
    }

    // Pause background music
    Audio.pauseBackgroundMusic();

    game.speed *= 0.99;
    airplane.mesh.rotation.z +=
      (-Math.PI / 2 - airplane.mesh.rotation.z) * 0.0002 * deltaTime;
    airplane.mesh.rotation.x += 0.0003 * deltaTime;
    game.planeFallSpeed *= 1.05;
    airplane.mesh.position.y -= game.planeFallSpeed * deltaTime;

    if (airplane.mesh.position.y < -200) {
      showReplay();
      game.status = 'waitingReplay';
    }
  } else if (game.status == 'waitingReplay') {
    // Ensure pointer is unlocked in waiting state
    if (isPointerLocked) {
      unlockPointer();
    }

    // Ensure background music is paused
    Audio.pauseBackgroundMusic();
  }

  if (airplane && airplane.propeller && airplane.propeller.rotation) {
    airplane.propeller.rotation.x += 0.2 + game.planeSpeed * deltaTime * 0.005;
  }
  sea.mesh.rotation.z += game.speed * deltaTime; //*game.seaRotationSpeed;

  if (sea.mesh.rotation.z > 2 * Math.PI) sea.mesh.rotation.z -= 2 * Math.PI;

  ambientLight.intensity += (0.5 - ambientLight.intensity) * deltaTime * 0.005;

  coinsHolder.rotateCoins();
  ennemiesHolder.rotateEnnemies();

  sky.moveClouds();
  sea.moveWaves();

  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

function updateDistance() {
  game.distance += game.speed * deltaTime * game.ratioSpeedDistance;
  fieldDistance.innerHTML = Math.floor(game.distance);
  var d =
    502 *
    (1 -
      (game.distance % game.distanceForLevelUpdate) /
        game.distanceForLevelUpdate);
  levelCircle.setAttribute('stroke-dashoffset', d);
}

var blinkEnergy = false;

function updateEnergy() {
  game.energy -= game.speed * deltaTime * game.ratioSpeedEnergy;
  game.energy = Math.max(0, game.energy);
  energyBar.style.right = 100 - game.energy + '%';
  energyBar.style.backgroundColor = game.energy < 50 ? '#f25346' : '#68c3c0';

  if (game.energy < 30) {
    energyBar.style.animationName = 'blinking';
  } else {
    energyBar.style.animationName = 'none';
  }

  if (game.energy < 1) {
    game.status = 'gameover';
  }
}

function addEnergy() {
  game.energy += game.coinValue;
  game.energy = Math.min(game.energy, 100);
}

function removeEnergy() {
  game.energy -= game.ennemyValue;
  game.energy = Math.max(0, game.energy);
}

function updatePlane() {
  game.planeSpeed = normalize(
    mousePos.x,
    -0.5,
    0.5,
    game.planeMinSpeed,
    game.planeMaxSpeed
  );
  var targetY = normalize(
    mousePos.y,
    -0.75,
    0.75,
    game.planeDefaultHeight - game.planeAmpHeight,
    game.planeDefaultHeight + game.planeAmpHeight
  );
  var targetX = normalize(
    mousePos.x,
    -1,
    1,
    -game.planeAmpWidth * 0.7,
    -game.planeAmpWidth
  );

  game.planeCollisionDisplacementX += game.planeCollisionSpeedX;
  targetX += game.planeCollisionDisplacementX;

  game.planeCollisionDisplacementY += game.planeCollisionSpeedY;
  targetY += game.planeCollisionDisplacementY;

  airplane.mesh.position.y +=
    (targetY - airplane.mesh.position.y) * deltaTime * game.planeMoveSensivity;
  airplane.mesh.position.x +=
    (targetX - airplane.mesh.position.x) * deltaTime * game.planeMoveSensivity;

  airplane.mesh.rotation.z =
    (targetY - airplane.mesh.position.y) * deltaTime * game.planeRotXSensivity;
  airplane.mesh.rotation.x =
    (airplane.mesh.position.y - targetY) * deltaTime * game.planeRotZSensivity;
  var targetCameraZ = normalize(
    game.planeSpeed,
    game.planeMinSpeed,
    game.planeMaxSpeed,
    game.cameraNearPos,
    game.cameraFarPos
  );
  camera.fov = normalize(mousePos.x, -1, 1, 40, 80);
  camera.updateProjectionMatrix();
  camera.position.y +=
    (airplane.mesh.position.y - camera.position.y) *
    deltaTime *
    game.cameraSensivity;

  game.planeCollisionSpeedX +=
    (0 - game.planeCollisionSpeedX) * deltaTime * 0.03;
  game.planeCollisionDisplacementX +=
    (0 - game.planeCollisionDisplacementX) * deltaTime * 0.01;
  game.planeCollisionSpeedY +=
    (0 - game.planeCollisionSpeedY) * deltaTime * 0.03;
  game.planeCollisionDisplacementY +=
    (0 - game.planeCollisionDisplacementY) * deltaTime * 0.01;

  airplane.pilot.updateHairs();

  // Always update bee wings animation
  airplane.updateWings();
}

function showReplay() {
  replayMessage.style.display = 'block';
}

function hideReplay() {
  replayMessage.style.display = 'none';
}

function normalize(v, vmin, vmax, tmin, tmax) {
  var nv = Math.max(Math.min(v, vmax), vmin);
  var dv = vmax - vmin;
  var pc = (nv - vmin) / dv;
  var dt = tmax - tmin;
  var tv = tmin + pc * dt;
  return tv;
}

var fieldDistance, energyBar, replayMessage, fieldLevel, levelCircle;

function init(event) {
  // DOM elements
  fieldLevel = document.getElementById('levelValue');
  fieldDistance = document.getElementById('distValue');
  energyBar = document.getElementById('energyBar');
  replayMessage = document.getElementById('replayMessage');
  levelCircle = document.getElementById('levelCircleStroke');

  resetGame();
  createScene();

  createLights();
  createPlane();
  createSea();
  createSky();
  createCoins();
  createEnnemies();
  createParticles();

  // Completely replace createTrees function
  console.log('Creating trees...');
  createTrees();
  console.log('Trees initialization complete');

  // Set bee mode
  window.isBeeMode = true;

  // Initialize audio
  Audio.init();

  // Event listeners
  document.addEventListener('mousemove', handleMouseMove, false);
  document.addEventListener('touchmove', handleTouchMove, false);
  document.addEventListener('mouseup', handleMouseUp, false);
  document.addEventListener('touchend', handleTouchEnd, false);

  // Setup pointer lock
  setupPointerLock();

  // Listen for game start event to play background music
  window.addEventListener('gamestart', function () {
    Audio.playBackgroundMusic();
  });

  loop();
}

// Execute init when DOM is loaded
// document.addEventListener('DOMContentLoaded', init, false);

// Export init function to global scope for main.js to call
window.init = init;

// Pointer Lock Functions
function setupPointerLock() {
  if (pointerLockSupported) {
    // Setup the click event listener for the container
    container.addEventListener('click', lockPointer);

    // Pointer lock change event listeners
    document.addEventListener('pointerlockchange', pointerLockChange, false);
    document.addEventListener('mozpointerlockchange', pointerLockChange, false);
    document.addEventListener(
      'webkitpointerlockchange',
      pointerLockChange,
      false
    );

    // Pointer lock error event listeners
    document.addEventListener('pointerlockerror', pointerLockError, false);
    document.addEventListener('mozpointerlockerror', pointerLockError, false);
    document.addEventListener(
      'webkitpointerlockerror',
      pointerLockError,
      false
    );

    // Add pointer lock instructions
    const instructions = document.createElement('div');
    instructions.id = 'pointer-lock-instructions';
    instructions.innerHTML = 'Click on the game to lock pointer';
    instructions.style.position = 'absolute';
    instructions.style.top = '10px';
    instructions.style.left = '10px';
    instructions.style.color = 'white';
    instructions.style.backgroundColor = 'rgba(0,0,0,0.5)';
    instructions.style.padding = '5px 10px';
    instructions.style.borderRadius = '5px';
    instructions.style.pointerEvents = 'none';
    instructions.style.display = 'none';
    container.parentNode.appendChild(instructions);

    // Show instructions once game starts
    window.addEventListener('gamestart', function () {
      if (!isPointerLocked) {
        instructions.style.display = 'block';
      }
    });
  }
}

function lockPointer() {
  if (pointerLockSupported && game.status === 'playing') {
    container.requestPointerLock =
      container.requestPointerLock ||
      container.mozRequestPointerLock ||
      container.webkitRequestPointerLock;
    container.requestPointerLock();
  }
}

function unlockPointer() {
  if (pointerLockSupported) {
    document.exitPointerLock =
      document.exitPointerLock ||
      document.mozExitPointerLock ||
      document.webkitExitPointerLock;
    document.exitPointerLock();
  }
}

function pointerLockChange() {
  const instructions = document.getElementById('pointer-lock-instructions');
  const pointerLockHint = document.getElementById('pointerLockHint');
  const worldContainer = document.getElementById('world');

  if (
    document.pointerLockElement === container ||
    document.mozPointerLockElement === container ||
    document.webkitPointerLockElement === container
  ) {
    isPointerLocked = true;
    if (instructions) instructions.style.display = 'none';
    if (pointerLockHint) {
      pointerLockHint.classList.add('visible');
      setTimeout(() => {
        pointerLockHint.classList.remove('visible');
      }, 3000); // Hide after 3 seconds
    }
    if (worldContainer) worldContainer.classList.add('pointer-locked');

    // Add escape key listener to unlock
    document.addEventListener('keydown', handleEscapeKey, false);
  } else {
    isPointerLocked = false;
    if (instructions && game.status === 'playing')
      instructions.style.display = 'block';
    if (pointerLockHint) pointerLockHint.classList.remove('visible');
    if (worldContainer) worldContainer.classList.remove('pointer-locked');

    // Remove escape key listener
    document.removeEventListener('keydown', handleEscapeKey, false);
  }
}

function pointerLockError() {
  console.error('Pointer lock error');
}

function handleEscapeKey(e) {
  if (e.keyCode === 27) {
    // Escape key
    unlockPointer();
  }
}

// Add tree type - more vibrant colors and simpler structure
var Tree = function () {
  this.mesh = new THREE.Object3D();

  // Tree trunk - thicker and taller
  var trunkGeom = new THREE.CylinderGeometry(5, 8, 60, 8);
  var trunkMat = new THREE.MeshPhongMaterial({
    color: 0x8b4513, // Brown
    flatShading: true,
    shininess: 0,
  });
  var trunk = new THREE.Mesh(trunkGeom, trunkMat);
  trunk.position.y = 30; // Trunk height
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  this.mesh.add(trunk);

  // Tree crown - larger and more prominent
  var crownGeom = new THREE.SphereGeometry(25, 16, 16);
  var crownMat = new THREE.MeshPhongMaterial({
    color: 0x2e8b57, // Sea green
    flatShading: true,
    shininess: 0,
  });
  var crown = new THREE.Mesh(crownGeom, crownMat);
  crown.position.y = 70; // Crown position
  crown.castShadow = true;
  this.mesh.add(crown);

  // Add second layer of crown
  var crown2 = new THREE.Mesh(crownGeom, crownMat);
  crown2.position.y = 50;
  crown2.scale.set(0.8, 0.8, 0.8);
  crown2.castShadow = true;
  this.mesh.add(crown2);
};

// Completely replace createTrees function
function createTrees() {
  console.log('Creating trees...');

  // Radius at game start, since game.seaRadius is a constant
  const groundY = -game.seaRadius;
  console.log('Ground level Y position:', groundY);

  // Build a very large tree directly in front
  var mainTree = new Tree();
  mainTree.mesh.position.set(0, groundY, -300); // Directly in front, level with the ground
  mainTree.mesh.scale.set(5, 5, 5); // Very large tree
  scene.add(mainTree.mesh);
  console.log('Large tree added at position:', mainTree.mesh.position);

  // Add 4 trees in front left and right to form a circle
  const treePositions = [
    { x: 150, z: -250 }, // Front right
    { x: -150, z: -250 }, // Front left
    { x: 50, z: -150 }, // Near right
    { x: -50, z: -150 }, // Near left
  ];

  for (let i = 0; i < treePositions.length; i++) {
    const pos = treePositions[i];
    var tree = new Tree();
    tree.mesh.position.set(pos.x, groundY, pos.z);
    tree.mesh.scale.set(3, 3, 3);
    scene.add(tree.mesh);
    console.log(`Tree ${i + 1} added at position:`, tree.mesh.position);
  }

  console.log('Total of 5 trees created and added to scene');
}
