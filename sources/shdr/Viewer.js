
 Viewer = (function() {
  Viewer.FRAGMENT = 0;

  Viewer.VERTEX = 1;

  Viewer.UNIFORMS = 2;

  function Viewer(dom, app) {
    this.dom = dom;
    this.app = app;
    this.time = 0.0;
    this.rotate = false;
    this.currentModel = null;
    this.rotateRate = 0.005;
    this.renderer = new THREE.WebGLRenderer({
      antialias: true
    });
    this.canvas = this.renderer.domElement;
    this.dom.appendChild(this.canvas);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(35, this.dom.clientWidth / this.dom.clientHeight, 1, 100000);
    this.controls = new THREE.OrbitControls(this.camera, this.dom);
    this.scene.add(this.camera);
    this.loader = new THREE.JSONLoader();

    //this.manager = new THREE.LoadingManager();
    //this.objLoader = new THREE.OBJLoader(this.manager);
    this.material = this.defaultMaterial();
    this.loadModel('models/suzanne_high.js');
    this.onResize();
    window.addEventListener('resize', ((function(_this) {
      return function() {
        return _this.onResize();
      };
    })(this)), false);
  }

  Viewer.prototype.update = function() {
    this.controls.update();
    this.time += 0.001;
    this.uniforms.time.value = this.time;
    if (this.model && this.rotate) {
      this.model.rotation.y += this.rotateRate;
    }
    return this.renderer.render(this.scene, this.camera);
  };

  Viewer.prototype.reset = function() {
    return this.model.rotation.y = 0;
  };

  Viewer.prototype.onResize = function() {
    if (this.camera) {
      this.camera.aspect = this.dom.clientWidth / this.dom.clientHeight;
      this.camera.updateProjectionMatrix();
      this.camera.position.z = 900 / this.dom.clientWidth * 4;
      this.camera.lookAt(this.scene.position);
    }
    if (this.uniforms) {
      this.uniforms.resolution.value.x = this.dom.clientWidth;
      this.uniforms.resolution.value.y = this.dom.clientHeight;
    }
    return this.renderer.setSize(this.dom.clientWidth, this.dom.clientHeight);
  };

  Viewer.prototype.loadModel = function(key) {
    this.ext = key.split(".");
    if (this.ext[1] === "obj") {
      this.objLoader.load(key, (function(_this) {
        return function(geo) {
          return _this.initModel(geo, key);
        };
      })(this));
    } else {
      this.loader.load(key, (function(_this) {
        return function(geo) {
          return _this.initModel(geo, key);
        };
      })(this));
    }
    return this.app.ui.showModelLoader();
  };

  Viewer.prototype.initModel = function(geo, key) {
    var data, old;
    this.currentModel = key;
    data = shdr.Models[key];
    if (this.model != null) {
      old = this.model.geometry;
      this.scene.remove(this.model);
      old.dispose();
    }
    this.model = new THREE.Mesh(geo, this.material);
    if (data != null) {
      if (data.scale != null) {
        this.model.scale.set(data.scale, data.scale, data.scale);
      }
    }
    this.scene.add(this.model);
    return this.app.ui.hideModelLoader();
  };

  Viewer.prototype.updateShader = function(shader, mode) {
    if (mode == null) {
      mode = Viewer.FRAGMENT;
    }
    if (mode === Viewer.FRAGMENT) {
      this.fs = shader;
      this.material.fragmentShader = shader;
    } else if (mode === Viewer.UNIFORMS) {
      this.resetUniforms();
      this.addCustomUniforms(this.parseUniforms(shader));
      this.material.uniforms = this.uniforms;
    } else {
      this.vs = shader;
      this.material.vertexShader = shader;
    }
    return this.material.needsUpdate = true;
  };

  Viewer.prototype.resetUniforms = function() {
    return this.uniforms = {
      time: {
        type: 'f',
        value: this.time
      },
      resolution: {
        type: 'v2',
        value: new THREE.Vector2(this.dom.clientWidth, this.dom.clientHeight)
      }
    };
  };

  Viewer.prototype.parseUniforms = function(uniformStr) {
    var error, i, len, line, lineNum, name, ref, session, toParse, tokens, type, uniform, uniformObj, value, vectorVals;
    error = false;
    toParse = uniformStr.split(';');
    uniformObj = {};
    lineNum = 0;
    for (i = 0, len = toParse.length; i < len; i++) {
      line = toParse[i];
      lineNum += 1;
      if (!line.trim().length) {
        continue;
      }
      tokens = line.trim().split(' ');
      if (!tokens.length) {
        continue;
      }
      if (tokens.length < 4) {
        this.app.ui.setStatus('Invalid syntax at line ' + lineNum, shdr.UI.ERROR);
        session = this.app.editor.getSession();
        this.app.marker = session.highlightLines(lineNum - 1, lineNum - 1);
        error = true;
        continue;
      }
      type = tokens[0];
      name = tokens[1];
      value = tokens.slice(3).join(' ');
      if (tokens[2] !== '=') {
        this.app.ui.setStatus('Invalid syntax at line ' + lineNum + ': expected =', shdr.UI.ERROR);
        session = this.app.editor.getSession();
        this.app.marker = session.highlightLines(lineNum - 1, lineNum - 1);
        error = true;
        continue;
      }
      uniform = {};
      if (type === 'float') {
        uniform['type'] = 'f';
        uniform['value'] = parseFloat(value);
      } else if (type === 'int') {
        uniform['type'] = 'i';
        uniform['value'] = parseInt(value);
      } else if (type === 'bool') {
        uniform['type'] = 'i';
        uniform['value'] = (ref = value === 'true') != null ? ref : {
          1: 0
        };
      } else if (type === 'vec2') {
        vectorVals = value.slice(5, value.length - 1).split(',').map(parseFloat);
        if (vectorVals.length !== 2) {
          this.app.ui.setStatus('Invalid syntax at line ' + lineNum + ': wrong number of arguments', shdr.UI.ERROR);
          error = true;
        }
        uniform['type'] = 'v2';
        uniform['value'] = new THREE.Vector2(vectorVals[0], vectorVals[1]);
      } else if (type === 'vec3') {
        vectorVals = value.slice(5, value.length - 1).split(',').map(parseFloat);
        if (vectorVals.length !== 3) {
          this.app.ui.setStatus('Invalid syntax at line ' + lineNum + ': wrong number of arguments', shdr.UI.ERROR);
          error = true;
        }
        uniform['type'] = 'v3';
        uniform['value'] = new THREE.Vector3(vectorVals[0], vectorVals[1], vectorVals[2]);
      } else if (type === 'vec4') {
        vectorVals = value.slice(5, value.length - 1).split(',').map(parseFloat);
        if (vectorVals.length !== 4) {
          this.app.ui.setStatus('Invalid syntax at line ' + lineNum + ': wrong number of arguments', shdr.UI.ERROR);
          error = true;
        }
        uniform['type'] = 'v4';
        uniform['value'] = new THREE.Vector4(vectorVals[0], vectorVals[1], vectorVals[2], vectorVals[3]);
      } else if (type === 'sampler2D') {
        uniform['type'] = 't';
        value = value.replace(/^"(.*)"$/, '$1');
        value = value.replace(/^"(.*)"$/, "$1");
        uniform['value'] = THREE.ImageUtils.loadTexture(shdr.Textures[value].data);
      } else {
        this.app.ui.setStatus('Unrecognized uniform type at line ' + lineNum + ': ' + type, shdr.UI.ERROR);
        error = true;
      }
      if (!error) {
        uniformObj[name] = uniform;
        this.app.ui.setStatus('Uniforms successfully compiled', shdr.UI.SUCCESS);
      } else {
        session = this.app.editor.getSession();
        this.app.marker = session.highlightLines(lineNum - 1, lineNum - 1);
        continue;
      }
    }
    return uniformObj;
  };

  Viewer.prototype.addCustomUniforms = function(uniformsObj) {
    var key, results, value;
    results = [];
    for (key in uniformsObj) {
      value = uniformsObj[key];
      if (uniformsObj.hasOwnProperty(key)) {
        results.push(this.uniforms[key] = value);
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

  Viewer.prototype.defaultMaterial = function() {
    this.resetUniforms();
    this.addCustomUniforms(this.parseUniforms(shdr.Snippets.DefaultUniforms));
    this.vs = shdr.Snippets.DefaultVertex;
    this.fs = shdr.Snippets.DefaultFragment;
    return new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: this.vs,
      fragmentShader: this.fs
    });
  };

  return Viewer;

})();


this.shdr.Viewer = Viewer;
