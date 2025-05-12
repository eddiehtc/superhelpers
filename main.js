// Import dependencies from npm
import * as THREE from 'three';
import { gsap, TweenMax, Power2 } from 'gsap';

// Import CSS
import './css/demo.css';
import './css/game.css';

// Make THREE and TweenMax globally available (for compatibility with old code)
window.THREE = THREE;
window.TweenMax = TweenMax;
window.Power2 = Power2;

// Always enable bee mode
window.isBeeMode = true;
console.log('Bee mode: enabled');

// Game initialization flag
let gameInitialized = false;

// Listen for game start event
window.addEventListener('gamestart', function () {
  if (!gameInitialized) {
    // Import game code only on first click
    import('./js/game.js').then(() => {
      console.log('Game code loaded');
      // Call init function to start the game
      setTimeout(() => {
        console.log('Initializing game...');
        if (typeof window.init === 'function') {
          window.init();
          console.log('Game started');
        } else {
          console.error('Init function not found');
        }
        gameInitialized = true;
      }, 100);
    });
  }
});
