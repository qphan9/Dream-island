import * as THREE from 'three';

export class TextureA3D extends THREE.WebGL3DRenderTarget {
  constructor(width, height, depth) {
    super(width, height, depth, {
      depthBuffer: false,
      stencilBuffer: false,
    });
    this.name = "TextureA3D";
    this.texture.type = THREE.UnsignedByteType;
    this.texture.format = THREE.RGBAFormat;
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.generateMipmaps = false;
  }
}

export class TextureB3D extends THREE.WebGL3DRenderTarget {
  constructor(width, height, depth) {
    super(width, height, depth, {
      depthBuffer: false,
      stencilBuffer: false,
    });
    this.name = "TextureB3D";
    this.texture.type = THREE.UnsignedByteType;
    this.texture.format = THREE.RGBAFormat;
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.generateMipmaps = false;
  }
}

export class TextureC2D extends THREE.WebGLRenderTarget {
  constructor(width, height) {
    super(width, height, {
      depthBuffer: false,
      stencilBuffer: false,
    });
    this.name = "TextureC3D"; // Keeping original name from codebase
    this.texture.type = THREE.UnsignedByteType;
    this.texture.format = THREE.RGBAFormat;
    this.texture.minFilter = THREE.NearestFilter;
    this.texture.magFilter = THREE.NearestFilter;
    this.texture.generateMipmaps = false;
  }
}

export class TextureEnvelope extends THREE.WebGLRenderTarget {
  constructor(width, height) {
    super(width, height, {
      depthBuffer: false,
      stencilBuffer: false,
    });
    this.name = "TextureEnvelope";
    this.texture.type = THREE.UnsignedByteType;
    this.texture.format = THREE.RGBAFormat;
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.generateMipmaps = false;
  }
}

export class TextureScene extends THREE.WebGLRenderTarget {
  constructor(width, height) {
    const depthTexture = new THREE.DepthTexture(width, height);
    depthTexture.type = THREE.FloatType;
    depthTexture.minFilter = THREE.NearestFilter;
    depthTexture.magFilter = THREE.NearestFilter;
    depthTexture.generateMipmaps = false;

    super(width, height, {
      stencilBuffer: false,
      depthBuffer: true,
      depthTexture: depthTexture,
    });
    this.name = "TextureTarget";
    this.texture.type = THREE.UnsignedByteType;
    this.texture.format = THREE.RGBAFormat;
    this.texture.minFilter = THREE.NearestFilter;
    this.texture.magFilter = THREE.NearestFilter;
    this.texture.generateMipmaps = false;
  }
}

export class TextureCloud extends THREE.WebGLRenderTarget {
  constructor(width, height) {
    super(width, height, {
      stencilBuffer: false,
      depthBuffer: false,
    });
    this.name = "TextureCloud";
  }
}
