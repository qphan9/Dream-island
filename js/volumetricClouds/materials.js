import * as THREE from 'three';
import { common, perlin, worley, defines, ray, intersectAABB, getWorldSpacePos, rayMarch } from './shaders.js';

export class TextureA3DMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uZCoord;
        uniform float uSeed;
        varying vec2 vUv;

        ${common}
        ${perlin}
        ${worley}

        void main() {
          float scale = 1.0;
          vec3 pos = vec3(vUv, uZCoord);
          pos += hash33(vec3(uSeed)) * 100.0;
          pos *= scale;

          float baseFreq = 4.0 * scale;

          float worleyFbmA = worleyFbm(pos, baseFreq);
          float worleyFbmB = worleyFbm(pos, baseFreq * 2.0);
          float worleyFbmC = worleyFbm(pos, baseFreq * 4.0);
          float perlinFbmVal = perlinFbm(pos, baseFreq, 7);

          float worleyPerlin = remap(perlinFbmVal, 0.0, 1.0, worleyFbmA, 1.0);

          gl_FragColor = vec4(worleyPerlin, worleyFbmA, worleyFbmB, worleyFbmC);
        }
      `,
      uniforms: {
        uZCoord: { value: 0 },
        uSeed: { value: 1 },
      },
    });
  }

  set zCoord(value) {
    this.uniforms.uZCoord.value = value;
  }
}

export class TextureB3DMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uZCoord;
        uniform float uSeed;
        varying vec2 vUv;

        ${common}
        ${worley}

        void main() {
          vec3 pos = vec3(vUv, uZCoord);
          pos += hash33(vec3(uSeed)) * 100.0;

          float baseFreq = 2.0;

          float worleyFbmA = worleyFbm(pos, baseFreq);
          float worleyFbmB = worleyFbm(pos, baseFreq * 2.0);
          float worleyFbmC = worleyFbm(pos, baseFreq * 4.0);

          gl_FragColor = vec4(worleyFbmA, worleyFbmB, worleyFbmC, 1.0);
        }
      `,
      uniforms: {
        uZCoord: { value: 0 },
        uSeed: { value: 1 },
      },
    });
  }

  set zCoord(value) {
    this.uniforms.uZCoord.value = value;
  }
}

export class TextureC2DMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uSeed;
        varying vec2 vUv;

        ${common}
        ${perlin}

        void main() {
          vec3 pos = vec3(vUv, 0.0);
          pos += hash33(vec3(uSeed)) * 100.0;

          float baseFreq = 4.0;

          float curlA = curlNoise(pos, baseFreq);
          float curlB = curlNoise(pos, baseFreq * 2.0);
          float curlC = curlNoise(pos, baseFreq * 4.0);

          gl_FragColor = vec4(curlA, curlB, curlC, 1.0);
        }
      `,
      uniforms: {
        uSeed: { value: 1 },
      },
    });
  }
}

export class TextureEnvelopeMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uSeed;
        varying vec2 vUv;

        ${common}
        ${perlin}

        float hash(float n) {
          return fract(sin(n) * 43758.5453);
        }

        float saturate(float value) {
          return clamp(value, 0.0, 1.0);
        }

        void main() {
          vec2 uv = vUv;

          // Min height
          float minHeight = 0.25;

          // Max height
          float scaleA = 2.0;
          float seedA = hash(2.0);
          float perlinA = perlinNoise(vec3((uv + (seedA * 1000.0)) * scaleA, 0.0), scaleA);
          perlinA = remap(perlinA, -1.0, 1.0, 0.0, 1.0);
          float maxHeight = perlinA;

          // Type
          float stratus = uv.y;
          stratus = saturate(1.0 - abs(stratus - 0.95) * 2.0);
          stratus = smoothstep(0.9, 1.0, stratus);
          
          float cumulus = uv.y;
          cumulus = saturate(1.0 - abs(cumulus - 0.7) * 2.0);
          cumulus = smoothstep(0.3, 0.7, cumulus);

          float cumulonimbus = uv.y;
          cumulonimbus = saturate(1.0 - abs(cumulonimbus - 0.55) * 2.0);
          cumulonimbus = smoothstep(0.0, 0.3, cumulonimbus);

          // Blend the types across uv.x
          float type = mix(stratus, cumulus, smoothstep(0.0, 0.5, uv.x));
          type = mix(type, cumulonimbus, smoothstep(0.5, 1.0, uv.x));

          // Out
          gl_FragColor = vec4(minHeight, maxHeight, type, 0.0);
        }
      `,
      uniforms: {
        uSeed: { value: 1 },
      },
    });
  }
}

export class CloudMaterial extends THREE.ShaderMaterial {
  constructor(renderer) {
    super({
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        varying vec3 vCameraPosition;
        varying vec3 vPosition;

        void main() {
          vUv = uv;
          vPosition = position;
          vCameraPosition = cameraPosition;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp sampler3D;

        ${defines}
        ${ray}
        ${intersectAABB}
        ${getWorldSpacePos}
        
        varying vec2 vUv;
        varying vec3 vCameraPosition;
        varying vec3 vPosition;
        
        uniform sampler2D uSceneTexture;
        uniform sampler2D uSceneDepthTexture;
        uniform sampler3D uTextureA;
        uniform sampler3D uTextureB;
        uniform sampler2D uTextureC;
        uniform sampler2D uTextureEnvelope;

        // Camera
        uniform vec2 uCameraNearFar;
        uniform vec3 uCameraPosition;
        uniform mat4 uProjectionInverse;
        uniform mat4 uCameraMatrixWorld;

        // Box
        uniform mat4 uMatrixWorldInv;
        uniform vec3 uBoxMin;
        uniform vec3 uBoxMax;

        uniform float uTime;

        float saturate(float value) {
          return clamp(value, 0.0, 1.0);
        }

        float remapVal(float inValue, float inOldMin, float inOldMax, float inMin, float inMax) {
          float old_min_max_range = (inOldMax - inOldMin);
          float clamped_normalized = saturate((inValue - inOldMin) / old_min_max_range);
          return inMin + (clamped_normalized*(inMax - inMin));
        }

        float remap2(float value, float valueMin, float valueMax) {
          return (value - valueMin) / (valueMax - valueMin);
        }

        float erode(float lowDetail, float highDetail, float factor) {
          float f = 1.0 - lowDetail;
          float h = factor;

          float a = highDetail * (1.0-h) + h;
          float result = saturate(remap2(a, f, f + h));

          return result;
        }

        float getDimensionalProfile(vec3 p, out float heightBlend) {
          vec4 textureEnvelope = texture(uTextureEnvelope, p.xz);
          float minHeight = textureEnvelope.r;
          float maxHeight = textureEnvelope.g;
          float cloudType = textureEnvelope.b;
          float density = textureEnvelope.a;

          float clampedHeight = p.y * step(minHeight, p.y) * step(p.y, maxHeight);
          float height = remapVal(clampedHeight, minHeight, maxHeight, 0.0, 1.0);
          height = abs(height - 0.5) * 2.0;
          height = 1.0 - height;

          float edgeGradient = length(p.xz - 0.5) * 2.0;
          edgeGradient = saturate(edgeGradient);
          edgeGradient = 1.0 - edgeGradient;
          edgeGradient = pow(edgeGradient, 1.0);

          float dimensionalProfile = height * edgeGradient;
        
          heightBlend = height;

          return dimensionalProfile;
        }
        
        float getDimensionalProfileFallback(vec3 p) {
          float cloudType;
          return getDimensionalProfile(p, cloudType);
        }

        float getCloudDensity(vec3 p) {
          float scale = 2.0;
          vec3 coord = p * scale;
          coord.x += uTime * 0.1;
          coord = mod(coord, 1.0);

          vec4 textureA = texture(uTextureA, coord);

          float perlinWorley = textureA.r;
          float worleyFbm4 = textureA.g;
          float worleyFbm8 = textureA.b;
          float worleyFbm16 = textureA.a;
          
          float heightBlend = 0.0;
          float dimensionalProfile = getDimensionalProfile(p, heightBlend);

          float noiseComposite = mix(pow(1.0 - perlinWorley, 1.0), perlinWorley, heightBlend);

          float cloudDensity = saturate(perlinWorley - (1.0 - dimensionalProfile));

          return cloudDensity;
        }

        ${rayMarch}

        void main() {
          vec2 uv = vUv;

          // Reconstruct world-space position from depth buffer to get ray direction
          vec3 worldSpacePos = computeWorldPosition(vUv, uSceneDepthTexture, uProjectionInverse, uCameraMatrixWorld);

          // Build the camera ray
          Ray ray;
          ray.origin = uCameraPosition;
          ray.dir = normalize(worldSpacePos - uCameraPosition);

          // Intersect with AABB cloud bounding box
          vec3 aabbMin = uBoxMin;
          vec3 aabbMax = uBoxMax;
          vec2 nearFar = intersectAABB(ray, aabbMin, aabbMax);

          // No intersection - discard (output transparent)
          if(nearFar.x >= nearFar.y) {
            discard;
            return;
          }

          // March and accumulate cloud color
          vec4 color = rayMarch(ray.origin, ray.dir, nearFar.x, nearFar.y, aabbMin, aabbMax);

          // Discard empty cloud pixels
          if(color.a < 0.001) {
            discard;
            return;
          }

          gl_FragColor = color;
        }
      `,
      uniforms: {
        uSceneTexture: { value: renderer.textureScene.texture },
        uSceneDepthTexture: { value: renderer.textureScene.depthTexture },
        uTextureA: { value: renderer.textureA3D.texture },
        uTextureB: { value: renderer.textureB3D.texture },
        uTextureC: { value: renderer.textureC2D.texture },
        uTextureEnvelope: { value: renderer.textureEnvelope.texture },

        uMatrixWorldInv: { value: new THREE.Matrix4() },
        uCameraNearFar: { value: new THREE.Vector2() },
        uCameraPosition: { value: new THREE.Vector3() },
        uProjectionInverse: { value: new THREE.Matrix4() },
        uCameraMatrixWorld: { value: new THREE.Matrix4() },

        uBoxMin: { value: new THREE.Vector3() },
        uBoxMax: { value: new THREE.Vector3() },

        uTime: { value: 0 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    });
    this._box = null;
  }

  update(dt, target, camera) {
    this.uniforms.uTime.value += dt;
    this.uniforms.uMatrixWorldInv.value.copy(target.matrixWorld).invert();

    this.uniforms.uCameraNearFar.value.set(camera.near, camera.far);
    this.uniforms.uCameraPosition.value.copy(camera.position);
    this.uniforms.uProjectionInverse.value.copy(camera.projectionMatrixInverse);
    this.uniforms.uCameraMatrixWorld.value.copy(camera.matrixWorld);

    // Always recompute world-space bounding box (handles position/scale changes)
    if (!this._box) this._box = new THREE.Box3();
    this._box.setFromObject(target);

    this.uniforms.uBoxMin.value.copy(this._box.min);
    this.uniforms.uBoxMax.value.copy(this._box.max);
  }
}

export class RenderMaterial extends THREE.ShaderMaterial {
  constructor(renderer) {
    super({
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp sampler2D;

        varying vec2 vUv;
        uniform sampler2D uCloudTexture;

        void main() {
          vec4 cloudColor = texture2D(uCloudTexture, vUv);
          // Discard pixels with no cloud to avoid darkening the scene
          if(cloudColor.a < 0.001) discard;
          gl_FragColor = cloudColor;
        }
      `,
      uniforms: {
        uCloudTexture: { value: renderer.textureCloud.texture },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    });
  }
}
