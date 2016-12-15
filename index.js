/* global AFRAME, THREE */
if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before AFRAME was available.');
}

var createText = require('three-bmfont-text');
var loadFont = require('load-bmfont');
var SDFShader = require('./lib/shaders/sdf');

require('./extras/text-primitive.js'); // Register experimental text primitive

/**
 * bmfont text component for A-Frame.
 */
AFRAME.registerComponent('bmfont-text', {
  schema: {
    text: {
      type: 'string'
    },
    width: {
      type: 'number',
      default: 1000
    },
    align: {
      type: 'string',
      default: 'left'
    },
    anchor: {
      type: 'string',
      default: 'left'
    },
    letterSpacing: {
      type: 'number',
      default: 0
    },
    lineHeight: {
      type: 'number',
      default: 38
    },
    fnt: {
      type: 'string',
      default: 'https://cdn.rawgit.com/bryik/aframe-bmfont-text-component/aa0655cf90f646e12c40ab4708ea90b4686cfb45/assets/DejaVu-sdf.fnt'
    },
    fntImage: {
      type: 'string',
      default: 'https://cdn.rawgit.com/bryik/aframe-bmfont-text-component/aa0655cf90f646e12c40ab4708ea90b4686cfb45/assets/DejaVu-sdf.png'
    },
    mode: {
      type: 'string',
      default: 'normal'
    },
    color: {
      type: 'color',
      default: '#000'
    },
    opacity: {
      type: 'number',
      default: '1.0'
    }
  },

  /**
   * Called when component is attached and when component data changes.
   * Generally modifies the entity based on the data.
   */
  update: function (oldData) {
    // Entity data
    var el = this.el;
    var data = this.data;

    // Use fontLoader utility to load 'fnt' and texture
    fontLoader({
      font: data.fnt,
      image: data.fntImage
    }, start);

    function start (font, texture) {
      // Setup texture, should set anisotropy to user maximum...
      texture.needsUpdate = true;
      texture.anisotropy = 16;

      var options = {
        font: font, // the bitmap font definition
        text: data.text, // the string to render
        width: data.width,
        align: data.align,
        anchor: data.anchor,
        letterSpacing: data.letterSpacing,
        lineHeight: data.lineHeight,
        mode: data.mode
      };

      // Create text geometry
      var geometry = createText(options);

      // Use './lib/shaders/sdf' to help build a shader material
      var material = new THREE.RawShaderMaterial(SDFShader({
        map: texture,
        side: THREE.DoubleSide,
        transparent: true,
        color: data.color,
        opacity: data.opacity
      }));

      var text = new THREE.Mesh(geometry, material);

      // Rotate so text faces the camera
      text.rotation.y = Math.PI;

      // Scale text down
      text.scale.multiplyScalar(-0.005);

      // Update position based on anchor
      updateAnchorPosition(text, geometry, data.anchor);

      // Register text mesh under entity's object3DMap
      el.setObject3D('bmfont-text', text);
    }
  },

  /**
   * Called when a component is removed (e.g., via removeAttribute).
   * Generally undoes all modifications to the entity.
   */
  remove: function () {
    this.el.removeObject3D('bmfont-text');
  }
});

/**
 * A utility to load a font with bmfont-load
 * and a texture with Three.TextureLoader()
 */
function fontLoader (opt, cb) {
  loadFont(opt.font, function (err, font) {
    if (err) {
      throw err;
    }

    var textureLoader = new THREE.TextureLoader();
    textureLoader.load(opt.image, function (texture) {
      cb(font, texture);
    });
  });
}

/**
 * Updates the text x position based on the anchor option
 */
 function updateAnchorPosition (text, geometry, anchor) {
   var x = 0;
   var layout = geometry.layout;

  switch (anchor) {
    case 'right':
      x = -layout.width;
      break;
    case 'center':
      x = -layout.width / 2;
    case 'left':
    default:
      x = 0;
  }

  text.position.x = Math.abs(text.scale.x) * x;
  geometry.computeBoundingSphere();
}
