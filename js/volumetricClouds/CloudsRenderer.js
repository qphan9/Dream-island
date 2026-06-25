import * as THREE from 'three';
import { TextureA3D, TextureB3D, TextureC2D, TextureEnvelope, TextureScene, TextureCloud } from './fbos.js';
import { TextureA3DMaterial, TextureB3DMaterial, TextureC2DMaterial, TextureEnvelopeMaterial, CloudMaterial, RenderMaterial } from './materials.js';
import { FullScreenQuad } from './FullScreenQuad.js';

export class CloudsRenderer {
  constructor(gl, size) {
    this._gl = gl;

    const downSampleFactor = 0.5;

    this.textureA3D = new TextureA3D(128, 128, 128);
    this.textureB3D = new TextureB3D(32, 32, 32);
    this.textureC2D = new TextureC2D(128, 128);
    this.textureEnvelope = new TextureEnvelope(256, 256);
    this.textureScene = new TextureScene(
      size.width * downSampleFactor,
      size.height * downSampleFactor
    );
    this.textureCloud = new TextureCloud(
      size.width * downSampleFactor,
      size.height * downSampleFactor
    );

    this.fsQuad = new FullScreenQuad();

    this.textureA3DMaterial = new TextureA3DMaterial();
    this.textureB3DMaterial = new TextureB3DMaterial();
    this.textureC2DMaterial = new TextureC2DMaterial();
    this.textureEnvelopeMaterial = new TextureEnvelopeMaterial();
    this.renderMaterial = new RenderMaterial(this);
    this.cloudMaterial = new CloudMaterial(this);

    this.generate3DTextures(this.textureA3DMaterial, this.textureA3D);
    this.generate3DTextures(this.textureB3DMaterial, this.textureB3D);
    this.generate2DTextures(this.textureC2DMaterial, this.textureC2D);
    this.generate2DTextures(this.textureEnvelopeMaterial, this.textureEnvelope);
  }

  get textures() {
    return [
      this.textureEnvelope,
      this.textureA3D,
      this.textureB3D,
      this.textureC2D,
    ];
  }

  generate2DTextures(material, fbo) {
    this.fsQuad.material = material;
    this._gl.setRenderTarget(fbo);
    this.fsQuad.render(this._gl);
    this._gl.setRenderTarget(null);
  }

  generate3DTextures(material, fbo) {
    const d = fbo.depth;

    this.fsQuad.material = material;

    for (let i = 0; i < d; i++) {
      const normalizedDepth = i / d;
      material.zCoord = normalizedDepth;

      this._gl.setRenderTarget(fbo, i);
      this.fsQuad.render(this._gl);
    }

    this._gl.setRenderTarget(null);
  }

  resize(size) {
    const downSampleFactor = 0.5;
    this.textureScene.setSize(size.width * downSampleFactor, size.height * downSampleFactor);
    this.textureCloud.setSize(size.width * downSampleFactor, size.height * downSampleFactor);
  }

  render(dt, target, camera, scene) {
    this._gl.setRenderTarget(this.textureScene);
    this._gl.render(target, camera);
    this._gl.setRenderTarget(null);

    const prevVisible = target.visible;
    target.visible = false;

    this._gl.render(scene, camera);

    const prevAutoClear = this._gl.autoClear;
    this._gl.autoClear = false;

    this.cloudMaterial.update(dt, target, camera);
    this.fsQuad.material = this.cloudMaterial;
    this._gl.setRenderTarget(this.textureCloud);
    this._gl.clear();
    this.fsQuad.render(this._gl);
    this._gl.setRenderTarget(null);

    this.fsQuad.material = this.renderMaterial;
    this.fsQuad.render(this._gl);

    this._gl.autoClear = prevAutoClear;
    target.visible = prevVisible;
  }
}
