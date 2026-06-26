export const common = /* glsl */ `
#define UI0 1597334673U
#define UI1 3812015801U
#define UI2 uvec2(UI0, UI1)
#define UI3 uvec3(UI0, UI1, 2798796415U)
#define UIF (1.0 / float(0xffffffffU))

vec3 hash33(vec3 p) {
	uvec3 q = uvec3(ivec3(p)) * UI3;
	q = (q.x ^ q.y ^ q.z)*UI3;
	return -1. + 2. * vec3(q) * UIF;
}

float remap(float x, float a, float b, float c, float d) {
  return (((x - a) / (b - a)) * (d - c)) + c;
}
`;

export const perlin = /* glsl */ `
// Gradient noise by iq (modified to be tileable)
float perlinNoise(vec3 x, float freq) {
    // grid
    vec3 p = floor(x);
    vec3 w = fract(x);
    
    // quintic interpolant
    vec3 u = w * w * w * (w * (w * 6. - 15.) + 10.);
    
    // gradients
    vec3 ga = hash33(mod(p + vec3(0., 0., 0.), freq));
    vec3 gb = hash33(mod(p + vec3(1., 0., 0.), freq));
    vec3 gc = hash33(mod(p + vec3(0., 1., 0.), freq));
    vec3 gd = hash33(mod(p + vec3(1., 1., 0.), freq));
    vec3 ge = hash33(mod(p + vec3(0., 0., 1.), freq));
    vec3 gf = hash33(mod(p + vec3(1., 0., 1.), freq));
    vec3 gg = hash33(mod(p + vec3(0., 1., 1.), freq));
    vec3 gh = hash33(mod(p + vec3(1., 1., 1.), freq));
    
    // projections
    float va = dot(ga, w - vec3(0., 0., 0.));
    float vb = dot(gb, w - vec3(1., 0., 0.));
    float vc = dot(gc, w - vec3(0., 1., 0.));
    float vd = dot(gd, w - vec3(1., 1., 0.));
    float ve = dot(ge, w - vec3(0., 0., 1.));
    float vf = dot(gf, w - vec3(1., 0., 1.));
    float vg = dot(gg, w - vec3(0., 1., 1.));
    float vh = dot(gh, w - vec3(1., 1., 1.));
	
    // interpolation
    return va + 
           u.x * (vb - va) + 
           u.y * (vc - va) + 
           u.z * (ve - va) + 
           u.x * u.y * (va - vb - vc + vd) + 
           u.y * u.z * (va - vc - ve + vg) + 
           u.z * u.x * (va - vb - ve + vf) + 
           u.x * u.y * u.z * (-va + vb + vc - vd + ve - vf - vg + vh);
}

float perlinFbm(vec3 p, float freq, int octaves) {
  float G = exp2(-.85);
  float amp = 1.;
  float noise = 0.;
  for (int i = 0; i < octaves; ++i)
  {
      noise += amp * perlinNoise(p * freq, freq);
      freq *= 2.;
      amp *= G;
  }
  
  float result = noise;
  result = mix(1.0, result, 0.5);

  return abs(result * 2. - 1.);
} 

float perlinFbm(vec3 p, float freq) {
  return perlinFbm(p, freq, 2);
}

// Domain warping perlin gradient noise
float curlNoise(vec3 p, float freq) {
  p *= freq;

  float curlFactor = 2.0;

  vec3 q = vec3(perlinNoise(p, freq), perlinNoise(p + vec3(5.2, 1.3, 7.1), freq), perlinNoise(p + vec3(1.7, 9.2, 3.1), freq));
  vec3 r = vec3(perlinNoise(p + q, freq), perlinNoise(p + q + vec3(5.2, 1.3, 7.1), freq), perlinNoise(p + q + vec3(1.7, 9.2, 3.1), freq));

  q = q * curlFactor;
  r = r * curlFactor;
  
  return remap(perlinNoise(p + r, freq), -1.0, 1.0, 0.0, 1.0);
}
`;

export const worley = /* glsl */ `
// Tileable 3D worley noise
float worleyNoise(vec3 uv, float freq) {    
    vec3 id = floor(uv);
    vec3 p = fract(uv);
    
    float minDist = 10000.;
    for (float x = -1.; x <= 1.; ++x)
    {
        for(float y = -1.; y <= 1.; ++y)
        {
            for(float z = -1.; z <= 1.; ++z)
            {
                vec3 offset = vec3(x, y, z);
            	vec3 h = hash33(mod(id + offset, vec3(freq))) * .5 + .5;
    			h += offset;
            	vec3 d = p - h;
           		minDist = min(minDist, dot(d, d));
            }
        }
    }
    
    // inverted worley noise
    return 1. - minDist;
}

float worleyFbm(vec3 p, float freq) {
    return worleyNoise(p*freq, freq) * .625 +
        	 worleyNoise(p*freq*2., freq*2.) * .25 +
        	 worleyNoise(p*freq*4., freq*4.) * .125;
} 
`;

export const defines = /* glsl */ `
#define PI 3.14159265359
#define N_VOL_STEPS 32
#define STEP_SIZE 0.04
#define MAX_STEPS 64
#define MAX_DIST 100.0
#define SURF_DIST 0.001
#define N_LIGHT_STEPS 2
#define LIGHT_STEP_SIZE 0.04
#define NB_STEPS 50

// Params
const float densityScale = 1.0;
const float transmittance = 1.0;
const float darknessThreshold = 0.025;
const float lightAbsorption = 1.0;
const float anisotropicFactor = 0.4;
const float phaseMix = 0.4;
const vec3 lightPosition = vec3(-2.0, 0, 2.0);
const vec3 lightColor = vec3(1.0) * 2.0;
const vec3 ambientLightColor = vec3(1.0) * 0.4;
`;

export const ray = /* glsl */ `
struct Ray {
  vec3 origin;
  vec3 dir;
};
`;

export const intersectAABB = /* glsl */ `
vec2 intersectTransformedAABB(Ray ray, mat4 invMatrix, vec3 boxMin, vec3 boxMax) {
  vec3 rayOrigin = (invMatrix * vec4(ray.origin, 1.0)).xyz;
  vec3 rayDir = (invMatrix * vec4(ray.dir, 0.0)).xyz;

  vec3 tMin = (boxMin - rayOrigin) / rayDir;
  vec3 tMax = (boxMax - rayOrigin) / rayDir;
  vec3 t1 = min(tMin, tMax);
  vec3 t2 = max(tMin, tMax);
  float tNear = max(max(t1.x, t1.y), t1.z);
  float tFar = min(min(t2.x, t2.y), t2.z);

  return vec2(tNear, tFar);
}

vec2 intersectAABB(Ray ray, vec3 boxMin, vec3 boxMax) {
  vec3 rayOrigin = ray.origin;
  vec3 rayDir = ray.dir;

  vec3 tMin = (boxMin - rayOrigin) / rayDir;
  vec3 tMax = (boxMax - rayOrigin) / rayDir;
  vec3 t1 = min(tMin, tMax);
  vec3 t2 = max(tMin, tMax);
  float tNear = max(max(t1.x, t1.y), t1.z);
  float tFar = min(min(t2.x, t2.y), t2.z);

  return vec2(tNear, tFar);
}

vec2 intersectSphere(Ray ray, vec3 sphereCenter, float sphereRadius) {
  vec3 oc = ray.origin - sphereCenter;
  float a = dot(ray.dir, ray.dir);
  float b = 2.0 * dot(oc, ray.dir);
  float c = dot(oc, oc) - sphereRadius * sphereRadius;
  float discriminant = b * b - 4.0 * a * c;

  if(discriminant < 0.0) {
    return vec2(-1.0, -1.0);
  }

  float t1 = (-b - sqrt(discriminant)) / (2.0 * a);
  float t2 = (-b + sqrt(discriminant)) / (2.0 * a);
 
  return vec2(t1, t2);
}

vec2 intersectAtmosphere(Ray ray, vec3 center, float planetRadius, float atmosphereRadius) {
  vec2 inner = intersectSphere(ray, center, planetRadius);
  vec2 outer = intersectSphere(ray, center, atmosphereRadius);

  bool isInsideAtmosphere = outer.x < 0.0;

  if(isInsideAtmosphere) {
    if(inner.x < 0.0 && inner.y < 0.0) {
      return vec2(0.0, outer.y);
    } else {
      return vec2(0.0, inner.x);
    }
  } else {
    if(inner.x < 0.0) {
      return outer;
    } else {
      return vec2(outer.x, inner.x);
    }
  }
}
`;

export const getWorldSpacePos = /* glsl */ `
vec3 computeWorldPosition(vec2 uv, sampler2D tDepth, mat4 uProjectionInverse, mat4 uMatrixWorld) {
		float normalizedDepth = texture2D( tDepth, uv).r; 
		
		vec4 ndc = vec4(
			(uv.x - 0.5) * 2.0,
			(uv.y - 0.5) * 2.0,
			(normalizedDepth - 0.5) * 2.0,
			1.0);
		
		vec4 clip = uProjectionInverse * ndc;
		vec4 view = uMatrixWorld * (clip / clip.w);
		vec3 result = view.xyz;
		
		return result;
}
`;

export const rayMarch = /* glsl */ `
float beersLaw(float density, float absorptionCoefficient) {
  return exp(-absorptionCoefficient * density);
}

float henyeyGreenstein(float g, float cosTheta) {
  float g2 = g * g;
  return 1.0 / (4.0 * PI * pow(1.0 + g2 - 2.0 * g * cosTheta, 1.5));
}

float dualLobeHenyeyGreenstein(float g, float cosTheta, float K) {
  return mix(
    henyeyGreenstein(g, cosTheta),
    henyeyGreenstein(-g, cosTheta),
    K
  );
}

float multipleScattering(float depth, float g, float cosTheta, float K) {
  int octaves = 2;
  float attenuation = 0.5;
  float contribution = 0.5;
  float phaseAttenuation = 0.1;

  float luminance = 0.0;

  float a = 1.0;
  float b = 1.0;
  float c = 1.0;

  for (int i = 0; i < octaves; i++) {
    float beer = beersLaw(depth, a);
    float phase = dualLobeHenyeyGreenstein(g * c, cosTheta, K);

    luminance += b * phase * beer;
    a *= attenuation;
    b *= contribution;
    c *= (1.0 - phaseAttenuation);
  }

  return luminance;
}

// Volumetric raymarching 
vec3 marchDirectionalLight(vec3 samplePos, vec3 lightDirection, float cosTheta, vec3 boxSize) {
  float lightDensity = 0.0;
  vec3 lightStep = (lightDirection * LIGHT_STEP_SIZE) / boxSize;

  for (int j = 0; j < N_LIGHT_STEPS; j++) {
    vec3 lightSamplePos = samplePos - lightStep * float(j + 1);

    float _lightDensity = getCloudDensity(lightSamplePos);
    _lightDensity = clamp(_lightDensity, 0.0, 1.0);
    lightDensity += _lightDensity * densityScale;

    if(lightDensity >= 1.0) break;
  }

  float luminance = multipleScattering(lightDensity, anisotropicFactor, cosTheta, phaseMix);
  return vec3(luminance);
}


vec4 rayMarch(vec3 ro, vec3 rd, float near, float far, vec3 aabbMin, vec3 aabbMax) {
  vec3 finalColor = vec3(0.0);
  float transmittance = 1.0;

  float depth = 0.0;
  float density = 0.0;

  vec3 lightPos = lightPosition;
  vec3 lightDirection = -normalize(lightPos - ro);

  float cosTheta = dot(rd, lightDirection);

  float stepSize = (far - near) / float(MAX_STEPS);
  int steps = MAX_STEPS;

  vec3 samplePoint = ro + rd * max(near, 0.0);
  samplePoint = (samplePoint - aabbMin) / (aabbMax - aabbMin);

  bool hasHit = false;
  float adaptiveStepSize = stepSize;
  
  vec3 boxSize = aabbMax - aabbMin;
  
  for (int i = 0; i < steps; i++) {
    vec3 stepVec = (rd * adaptiveStepSize) / boxSize;
    samplePoint += stepVec;

    if(samplePoint.x < 0.0 || samplePoint.x > 1.0 || samplePoint.y < 0.0 || samplePoint.y > 1.0 || samplePoint.z < 0.0 || samplePoint.z > 1.0) {
      break;
    }

    float _density = getCloudDensity(samplePoint);

    _density = clamp(_density, 0.0, 1.0);
    density += _density * densityScale;

    if(_density > 0.0) {
      if(!hasHit) {
        hasHit = true;
        depth -= adaptiveStepSize;
        samplePoint -= stepVec;
        adaptiveStepSize *= 0.5;
        vec3 nextStepVec = (rd * adaptiveStepSize) / boxSize;
        steps = int(1.0 / length(nextStepVec));
        continue;
      }

      vec3 luminance = marchDirectionalLight(samplePoint, lightDirection, cosTheta, boxSize);
      finalColor += lightColor * luminance * density * transmittance;
      transmittance *= beersLaw(density, lightAbsorption);

      // Ambient light
      vec3 ambientLight = ambientLightColor;
      finalColor += ambientLight * density * transmittance;
    } else {
      if(hasHit) {
        hasHit = false;
        adaptiveStepSize = stepSize;
        steps = MAX_STEPS;
      }
    }

    if(density >= 1.0) break;

    depth += adaptiveStepSize;
  }

  return vec4(finalColor, 1.0 - transmittance);
}

`;
