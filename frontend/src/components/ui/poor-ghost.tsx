import React, { useEffect, useRef } from 'react';

const PALETTE = {
  dark: "#0a0a14",            // match the page background
  light: "#f2f2f8",           // subtle highlight for light contrasts
  ghostlyGlow: "#00d9ff",     // electric cyan for eyes or accents
  skinShadow: "#bb00ff",      // deep magenta shadows
  flesh: "#ff006e",            // vibrant neon pink body
  tears: "rgba(187, 0, 255, 0.5)" // glowing accent for tear effects
};

const SCENE_SIZE = 400;

/**
 * Creates the 3D Ghost character model using Zdog.
 * @param {object} illo - The Zdog Illustration instance.
 * @returns {object} References to animatable parts of the model.
 */
const createCharacterModel = (illo) => {
    const Zdog = window.Zdog;
    const headAnchor = new Zdog.Anchor({ addTo: illo, translate: { y: -42 } });
    
    // Ghost Head
    new Zdog.Shape({ 
        addTo: headAnchor, 
        stroke: 230, 
        color: PALETTE.skinShadow 
    });
    new Zdog.Shape({ 
        addTo: headAnchor, 
        stroke: 220, 
        color: PALETTE.ghostlyGlow, 
        translate: { z: 5 } 
    });

    // Eyes
    const eyeAnchor = new Zdog.Anchor({ addTo: headAnchor, translate: { x: -66, y: -30, z: 84 }, rotate: { y: Zdog.TAU / 11 } });
    const eyeGroup = new Zdog.Group({ addTo: eyeAnchor });
    
    new Zdog.Shape({
        addTo: eyeGroup,
        fill: true,
        stroke: 0,
        color: PALETTE.skinShadow,
        scale: 1.35,
        path: [ { x: 0, y: 0, z: 3 }, { bezier: [ { x: 24, y: 0, z: 3 }, { x: 36, y: 21, z: 0 }, { x: 36, y: 36, z: 0 } ] }, { bezier: [ { x: 36, y: 51, z: 0 }, { x: 24, y: 63, z: 3 }, { x: 0, y: 63, z: 3 } ] }, { bezier: [ { x: -24, y: 63, z: 3 }, { x: -36, y: 51, z: 0 }, { x: -36, y: 36, z: 0 } ] }, { bezier: [ { x: -36, y: 21, z: 0 }, { x: -24, y: 0, z: 3 }, { x: 0, y: 0, z: 3 } ] } ]
    });

    const eye = new Zdog.Shape({addTo: eyeGroup,fill: true,stroke: 3,color: PALETTE.dark,translate: { y: 6 },path: [{ x: 0, y: 0, z: 3 },{ bezier: [ { x: 24, y: 0, z: 3 },{ x: 36, y: 21, z: 0 },{ x: 36, y: 36, z: 0 }]},{ bezier: [ { x: 36, y: 51, z: 0 },{ x: 24, y: 63, z: 3 },{ x: 0, y: 63, z: 3 }]},{ bezier: [ { x: -24, y: 63, z: 3 },{ x: -36, y: 51, z: 0 },{ x: -36, y: 36, z: 0 }]},{ bezier: [ { x: -36, y: 21, z: 0 },{ x: -24, y: 0, z: 3 },{ x: 0, y: 0, z: 3 }]}]});
    
    eye.copy({
        addTo: eye,
        fill: true,
        color: PALETTE.light,
        scale: 0.4,
        translate: { x: -9, y: 9, z: 3 }
    });
    
    new Zdog.Shape({
        addTo: eyeAnchor,
        fill: true,
        stroke: 0,
        color: PALETTE.tears,
        translate: { y: 63 },
        path: [ { x: 0, y: 0, z: 0 }, { x: 18, y: 0, z: 0 }, { arc: [{ x: 18, y: 45, z: 0 }, { x: 18, y: 70, z: -60 }] }, { bezier: [ { x: 18, y: 80, z: -80 }, { x: 18, y: 80, z: -100 }, { x: 0, y: 80, z: -100 } ] }, { bezier: [ { x: -18, y: 80, z: -100 }, { x: -18, y: 80, z: -80 }, { x: -18, y: 70, z: -60 } ] }, { arc: [{ x: -18, y: 45, z: 0 }, { x: -18, y: 0, z: 0 }] }, { x: 0, y: 0, z: 0 } ]
    });

    const eyeLeft = eyeAnchor.copyGraph({ translate: { x: 66, y: -30, z: 84 }, rotate: { y: Zdog.TAU / -11 } });
    
    // Mouth
    const mouthAnchor = new Zdog.Anchor({ addTo: headAnchor, translate: { y: 36, z: 96 }, rotate: { x: Zdog.TAU / -45 } });
    new Zdog.Shape({ addTo: mouthAnchor, stroke: 0, fill: true, color: PALETTE.dark, path: [ { x: 0, y: 0 }, { bezier: [ { x: 18, y: 0, z: 0 }, { x: 30, y: 21, z: -6 }, { x: 30, y: 40, z: -6 } ] }, { bezier: [ { x: 30, y: 51, z: -6 }, { x: 24, y: 33, z: -3 }, { x: 0, y: 33, z: -3 } ] }, { bezier: [ { x: -24, y: 33, z: -3 }, { x: -30, y: 51, z: -6 }, { x: -30, y: 30, z: -6 } ] }, { bezier: [ { x: -30, y: 21, z: -6 }, { x: -18, y: 0, z: 0 }, { x: 0, y: 0, z: 0 } ] } ] });
    
    // Tail
    const tailAnchor = new Zdog.Anchor({ addTo: illo, translate: { y: 10 } });
    new Zdog.Shape({
        addTo: tailAnchor,
        stroke: 90,
        color: PALETTE.ghostlyGlow,
        path: [
            { y: 0 },
            { bezier: [ { y: 30, z: 40 }, {y: 50, z: -40}, {y: 100, z: 0} ] }
        ],
    });

    return { headAnchor, tailAnchor, eyeRight: eye, eyeLeft: eyeLeft.children[0] };
};

/**
 * Renders the interactive 3D character animation.
 */
const InteractiveCharacter = (props) => {
  const canvasRef = useRef(null);
  const animationState = useRef({}).current; 

  useEffect(() => {
    let scriptsLoaded = 0;

    const initializeAnimation = () => {
      if (!canvasRef.current || !window.Zdog || !window.TweenMax) {
        setTimeout(initializeAnimation, 50);
        return;
      }
      const { Zdog, TweenMax, Sine } = window;
      const illo = new Zdog.Illustration({
        element: canvasRef.current,
        resize: 'fullscreen',
        onResize: function(width, height) { this.zoom = Math.min(width, height) / SCENE_SIZE; },
        dragRotate: false,
      });
      
      const model = createCharacterModel(illo);
      
      const setupAnimations = () => {
        TweenMax.to(illo.translate, 2, { y: -20, repeat: -1, yoyo: true, ease: Sine.easeInOut });
        return { stop: () => TweenMax.killAll() };
      };

      const setupEventListeners = () => {
        const watchPlayer = (x, y) => {
            const rect = canvasRef.current.getBoundingClientRect();
const rotX = Math.min((x - (rect.left + rect.width / 2)) / Zdog.TAU, 80);
            const rotY = -(y - (rect.top + rect.height / 2)) / Zdog.TAU;

            TweenMax.to(model.headAnchor.rotate, 0.5, { x: rotY / 100, y: -rotX / 100, ease: Sine.easeOut });
        };
        const handleMouseMove = (e) => watchPlayer(e.clientX, e.clientY);
        document.body.addEventListener("mousemove", handleMouseMove);
        return () => document.body.removeEventListener("mousemove", handleMouseMove);
      };

      const animate = () => {
        model.tailAnchor.rotate.y += 0.03;
        illo.updateRenderGraph();
        animationState.animationFrameId = requestAnimationFrame(animate);
      };

      const animationManager = setupAnimations();
      const removeEventListeners = setupEventListeners();
      animate();

      return () => {
        if (animationState.animationFrameId) cancelAnimationFrame(animationState.animationFrameId);
        removeEventListeners();
        animationManager.stop();
      };
    };

    const scripts = ["https://unpkg.com/zdog@1/dist/zdog.dist.min.js", "https://cdnjs.cloudflare.com/ajax/libs/gsap/2.1.3/TweenMax.min.js"];
    const onAllScriptsLoaded = () => {
        scriptsLoaded++;
        if (scriptsLoaded === scripts.length) initializeAnimation();
    };
    const loadScript = (src) => {
      if (document.querySelector(`script[src="${src}"]`)) { onAllScriptsLoaded(); return; }
      const script = document.createElement('script');
      script.src = src;
      script.onload = onAllScriptsLoaded;
      document.body.appendChild(script);
    };
    scripts.forEach(loadScript);

    return () => {
        if (window.TweenMax) {
            window.TweenMax.killAll();
        }
    };
  }, []);

  return <canvas ref={canvasRef} style={{display: 'block', width: '100vw', height: '100vh'}}> 
  </canvas>; scale-125
};

export default InteractiveCharacter;
