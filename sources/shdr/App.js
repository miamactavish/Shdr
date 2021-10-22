var App = (function() {
  App.UPDATE_ALL = 0;

  App.UPDATE_ENTER = 1;

  App.UPDATE_MANUAL = 2;

  App.FRAGMENT = 0;

  App.VERTEX = 1;

  App.UNIFORMS = 2;

  function App(domEditor, domCanvas, conf) {
    if (conf == null) {
      conf = {};
    }
    window.THREE_SHADER_OVERRIDE = true;
    this.initBaseurl();
    this.documents = ['', '', ''];
    this.marker = null;
    this.viewer = null;
    this.validator = null;
    this.conf = {
      update: App.UPDATE_ALL,
      mode: App.FRAGMENT
    };
    this.extend(this.conf, conf);
    this.ui = new shdr.UI(this);
    if (!this.initViewer(domCanvas)) {
      return;
    }
    this.initEditor(domEditor);
    this.initFromURL();
    this.byId(domEditor).addEventListener('keyup', ((function(_this) {
      return function(e) {
        return _this.onEditorKeyUp(e);
      };
    })(this)), false);
    this.byId(domEditor).addEventListener('keydown', ((function(_this) {
      return function(e) {
        return _this.onEditorKeyDown(e);
      };
    })(this)), false);
    this.ui.hideMainLoader();
    this.loop();
  }

  App.prototype.initBaseurl = function() {
    var hash, url;
    url = window.location.href;
    hash = url.indexOf('#');
    if (hash > 0) {
      this.baseurl = url.substr(0, hash);
    } else {
      this.baseurl = url;
    }
    if (this.baseurl.substr(0, 6) === "chrome") {
      return this.baseurl = "http://shdr.bkcore.com/";
    }
  };

  App.prototype.initViewer = function(domCanvas) {
    var conf, e, msg;
    try {
      this.viewer = new shdr.Viewer(this.byId(domCanvas), this);
      this.validator = new shdr.Validator(this.viewer.canvas);
    } catch (error) {
      e = error;
      console.warn(e);
      msg = "Unable to start Shdr. \n\nWebGL is either deactivated or not supported by your device or browser. \n\nWould you like to visit get.webgl.org for more info?";
      this.ui.setStatus(msg, shdr.UI.WARNING);
      this.ui.displayWebGLError();
      conf = confirm(msg);
      if (conf) {
        location.href = "http://get.webgl.org/";
      }
      return false;
    }
    return true;
  };

  App.prototype.initEditor = function(domEditor) {
    this.documents[App.FRAGMENT] = this.viewer.fs;
    this.documents[App.VERTEX] = this.viewer.vs;
    this.documents[App.UNIFORMS] = shdr.Snippets.DefaultUniforms;
    this.editor = ace.edit(domEditor);
    this.editor.setFontSize("16px");
    this.editor.setShowPrintMargin(false);
    this.editor.getSession().setTabSize(2);
    this.editor.getSession().setMode("ace/mode/glsl");
    this.editor.getSession().setUseWrapMode(true);
    this.editor.getSession().setValue(this.documents[this.conf.mode]);
    return this.editor.focus();
  };

  App.prototype.loop = function() {
    requestAnimationFrame((function(_this) {
      return function() {
        return _this.loop();
      };
    })(this));
    return this.update();
  };

  App.prototype.update = function() {
    return this.viewer.update();
  };

  App.prototype.updateShader = function() {
    var e, line, msg, newUniforms, ok, ref, session, src, type;
    session = this.editor.getSession();
    if (this.marker != null) {
      session.removeMarker(this.marker.id);
    }
    if (this.conf.mode === App.FRAGMENT) {
      type = shdr.Validator.FRAGMENT;
    } else if (this.conf.mode === App.UNIFORMS) {
      try {
        newUniforms = session.getValue();
        this.viewer.updateShader(newUniforms, App.UNIFORMS);
      } catch (error) {
        e = error;
        this.ui.setStatus('Uniform compilation failed', shdr.UI.ERROR);
      }
      return;
    } else {
      type = shdr.Validator.VERTEX;
    }
    src = session.getValue();
    if (!src) {
      this.ui.setStatus('Shader cannot be empty', shdr.UI.WARNING);
      this.marker = session.highlightLines(0, 0);
      return;
    }
    ref = this.validator.validate(src, type), ok = ref[0], line = ref[1], msg = ref[2];
    if (ok) {
      this.viewer.updateShader(src, this.conf.mode);
      return this.ui.setStatus('Shader successfully compiled', shdr.UI.SUCCESS);
    } else {
      line = Math.max(0, line - 1);
      this.marker = session.highlightLines(line, line);
      return this.ui.setStatus("Line " + line + " : " + msg, shdr.UI.ERROR);
    }
  };

  App.prototype.initFromURL = function() {
    var obj;
    obj = this.unpackURL();
    return this.initDocuments(obj);
  };

  App.prototype.initDocuments = function(obj) {
    var _fs, _vs, fl, fm, fs, ref, ref1, uniforms, vl, vm, vs;
    if (obj && obj.documents) {
      this.documents = obj.documents;
      fs = this.documents[App.FRAGMENT];
      vs = this.documents[App.VERTEX];
      uniforms = this.documents[App.UNIFORMS];
      ref = this.validator.validate(fs, shdr.Validator.FRAGMENT), _fs = ref[0], fl = ref[1], fm = ref[2];
      ref1 = this.validator.validate(vs, shdr.Validator.VERTEX), _vs = ref1[0], vl = ref1[1], vm = ref1[2];
      this.viewer.updateShader(uniforms, App.UNIFORMS);
      if (_fs && _vs) {
        this.viewer.updateShader(vs, App.VERTEX);
        this.viewer.updateShader(fs, App.FRAGMENT);
        this.editor.getSession().setValue(this.conf.mode === App.VERTEX ? vs : fs);
        this.ui.setMenuMode(App.FRAGMENT);
        this.ui.setStatus("Shaders successfully loaded and compiled.", shdr.UI.SUCCESS);
      } else if (_vs) {
        this.viewer.updateShader(vs, App.VERTEX);
        this.setMode(App.FRAGMENT, true);
        this.ui.setMenuMode(App.FRAGMENT);
        this.ui.setStatus("Shaders loaded but Fragment could not compile. Line " + fl + " : " + fm, shdr.UI.WARNING);
      } else if (_fs) {
        this.viewer.updateShader(fs, App.FRAGMENT);
        this.setMode(App.VERTEX, true);
        this.ui.setMenuMode(App.VERTEX);
        this.ui.setStatus("Shaders loaded but Vertex could not compile. Line " + vl + " : " + vm, shdr.UI.WARNING);
      } else {
        this.setMode(App.VERTEX, true);
        this.ui.setMenuMode(App.VERTEX);
        this.ui.setStatus("Shaders loaded but could not compile. Line " + vl + " : " + vm, shdr.UI.WARNING);
      }
      this.editor.focus();
      return true;
    } else {
      return false;
    }
  };

  App.prototype.packURL = function() {
    var e, json, obj, packed;
    try {
      obj = {
        documents: this.documents,
        model: this.viewer.currentModel
      };
      json = JSON.stringify(obj);
      packed = window.btoa(RawDeflate.deflate(json));
      return this.baseurl + '#1/' + packed;
    } catch (error) {
      e = error;
      return this.ui.setStatus("Unable to pack document: " + (typeof e.getMessage === "function" ? e.getMessage() : void 0), shdr.UI.WARNING);
    }
  };

  App.prototype.unpackURL = function() {
    var e, hash, json, obj, packed, version;
    if (!window.location.hash) {
      return false;
    }
    try {
      hash = window.location.hash.substr(1);
      version = hash.substr(0, 2);
      packed = hash.substr(2);
      json = RawDeflate.inflate(window.atob(packed));
      obj = JSON.parse(json);
      return obj;
    } catch (error) {
      e = error;
      return this.ui.setStatus("Unable to unpack document: " + (typeof e.getMessage === "function" ? e.getMessage() : void 0), shdr.UI.WARNING);
    }
  };

  App.prototype.shortenURL = function(url, callback) {
    var key;
    key = 'AIzaSyB46wUnmnZaPH9JkHlRizmsQw9W2SSx1x0';
    return $.ajax({
      url: "https://www.googleapis.com/urlshortener/v1/url?key=" + key,
      type: 'POST',
      contentType: 'application/json',
      dataType: 'json',
      data: JSON.stringify({
        longUrl: url
      }),
      success: (function(_this) {
        return function(resp) {
          if (!resp || 'error' in resp || !'id' in resp) {
            _this.ui.setStatus('An error occured while trying to shorten shared URL.', shdr.UI.WARNING);
            console.warn(resp);
            return typeof callback === "function" ? callback(false, null, resp) : void 0;
          } else {
            _this.ui.setStatus('Shared URL has been shortened.', shdr.UI.SUCCESS);
            return typeof callback === "function" ? callback(true, resp.id, resp) : void 0;
          }
        };
      })(this),
      error: (function(_this) {
        return function(e) {
          if (typeof callback === "function") {
            callback(false, null, e);
          }
          _this.ui.setStatus('URL shortening service is not active.', shdr.UI.WARNING);
          return console.warn('ERROR: ', e);
        };
      })(this)
    });
  };

  App.prototype.texture = function(textureObj) {
    var e, reader;
    try {
      this.ui.setStatus('Uploading...', shdr.UI.WARNING);
      reader = new FileReader();
      reader.readAsDataURL(textureObj);
      console.log(textureObj);
      return reader.onload = (function(_this) {
        return function(e) {
          var texture;
          console.log("onload happened");
          texture = {
            name: textureObj.name,
            data: e.target.result
          };
          shdr.Textures[texture.name] = texture;
          return _this.ui.setStatus('Uploaded', shdr.UI.SUCCESS);
        };
      })(this);
    } catch (error) {
      e = error;
      return this.ui.setStatus('You must select a texture to upload.', shdr.UI.WARNING);
    }
  };

  App.prototype.upload = function(fileObj) {
    var e, reader;
    try {
      this.ui.setStatus('Uploading...', shdr.UI.WARNING);
      reader = new FileReader();
      reader.readAsDataURL(fileObj);
      return reader.onload = (function(_this) {
        return function(e) {
          var model;
          model = {
            name: fileObj.name.split('.')[0],
            data: e.target.result
          };
          shdr.Models[e.target.result] = model;
          _this.ui.setStatus('Uploaded', shdr.UI.SUCCESS);
          return _this.ui.addNewModel(fileObj.name, e.target.result);
        };
      })(this);
    } catch (error) {
      e = error;
      return this.ui.setStatus('You must select a .js model to upload.', shdr.UI.WARNING);
    }
  };

  App.prototype.download = function() {
    var blob, e, url, win;
    try {
      blob = new Blob(["#ifdef VS \n \n" + this.documents[App.VERTEX] + "\n \n#else \n \n" + this.documents[App.FRAGMENT] + "\n \n#endif"], {
        type: 'text/plain'
      });
      url = URL.createObjectURL(blob);
      win = window.open(url, '_blank');
      if (win) {
        win.focus();
      } else {
        this.ui.setStatus('Your browser as blocked the download, please disable popup blocker.', shdr.UI.WARNING);
      }
    } catch (error) {
      e = error;
      this.ui.setStatus('Your browser does not support Blob, unable to download.', shdr.UI.WARNING);
    }
    return url;
  };

  App.prototype.save = function(name) {
    var obj;
    this.updateDocument();
    obj = {
      documents: this.documents,
      name: name,
      date: +Date.now()
    };
    shdr.Storage.addDocument(name, obj);
    this.ui.resetLoadFiles();
    return this.ui.setStatus("Shaders saved as '" + name + "'.", shdr.UI.SUCCESS);
  };

  App.prototype.load = function(name) {
    var obj;
    obj = shdr.Storage.getDocument(name);
    if (obj != null) {
      this.initDocuments(obj);
      return true;
    } else {
      this.ui.setStatus("'" + name + "' Shaders do not exist.", shdr.UI.WARNING);
      return false;
    }
  };

  App.prototype["new"] = function() {
    var obj;
    obj = {
      documents: [shdr.Snippets.DefaultFragment, shdr.Snippets.DefaultVertex, shdr.Snippets.DefaultUniforms],
      name: 'Untitled'
    };
    this.initDocuments(obj);
    this.ui.setStatus('Editor reset using default shaders.', shdr.UI.SUCCESS);
    this.ui.clearName('Untitled');
    return loadModel('models/suzanne_high.js');
  };

  App.prototype.newDemo = function() {
    var obj;
    obj = {
      documents: [shdr.Snippets.DemoFragment, shdr.Snippets.DemoVertex],
      name: 'Untitled'
    };
    this.initDocuments(obj);
    this.ui.setStatus('Editor reset using default shaders.', shdr.UI.SUCCESS);
    this.ui.clearName('Untitled');
    return this.viewer.loadModel('models/quad.js');
  };

  App.prototype.remove = function(name, reset) {
    var removed;
    if (reset == null) {
      reset = false;
    }
    removed = shdr.Storage.removeDocument(name);
    if (removed) {
      if (reset) {
        this["new"]();
      }
      this.ui.resetLoadFiles();
      return this.ui.setStatus("'" + name + "' Shaders removed.", shdr.UI.INFO);
    } else {
      return this.ui.setStatus("Unable to remove '" + name + "'. Shaders do not exist.", shdr.UI.WARNING);
    }
  };

  App.prototype.updateDocument = function() {
    return this.documents[this.conf.mode] = this.editor.getSession().getValue();
  };

  App.prototype.onEditorKeyUp = function(e) {
    var key, proc;
    key = e.keyCode;
    proc = this.conf.update === App.UPDATE_ENTER && key === 13;
    proc || (proc = this.conf.update === App.UPDATE_ALL);
    if (proc) {
      this.updateShader();
    }
    return true;
  };

  App.prototype.onEditorKeyDown = function(e) {
    if (e.ctrlKey && e.keyCode === 83) {
      this.updateShader();
      e.cancelBubble = true;
      e.returnValue = false;
      if (typeof e.stopPropagation === "function") {
        e.stopPropagation();
      }
      if (typeof e.preventDefault === "function") {
        e.preventDefault();
      }
      return false;
    } else if (e.ctrlKey && e.altKey) {
      if (this.conf.mode === App.FRAGMENT) {
        this.setMode(App.VERTEX, true);
        this.ui.setMenuMode(App.VERTEX);
      } else {
        this.setMode(App.FRAGMENT, true);
        this.ui.setMenuMode(App.FRAGMENT);
      }
      e.cancelBubble = true;
      e.returnValue = false;
      if (typeof e.stopPropagation === "function") {
        e.stopPropagation();
      }
      if (typeof e.preventDefault === "function") {
        e.preventDefault();
      }
      return false;
    } else {
      return true;
    }
  };

  App.prototype.setUpdateMode = function(mode) {
    this.conf.update = parseInt(mode);
    return this;
  };

  App.prototype.setMode = function(mode, force) {
    var old, session;
    if (mode == null) {
      mode = App.FRAGMENT;
    }
    if (force == null) {
      force = false;
    }
    mode = parseInt(mode);
    if (this.conf.mode === mode && !force) {
      return false;
    }
    old = this.conf.mode;
    this.conf.mode = mode;
    session = this.editor.getSession();
    switch (mode) {
      case App.FRAGMENT:
        if (!force) {
          this.documents[old] = session.getValue();
        }
        session.setValue(this.documents[App.FRAGMENT]);
        break;
      case App.VERTEX:
        if (!force) {
          this.documents[old] = session.getValue();
        }
        session.setValue(this.documents[App.VERTEX]);
        break;
      case App.UNIFORMS:
        if (!force) {
          this.documents[old] = session.getValue();
        }
        session.setValue(this.documents[App.UNIFORMS]);
    }
    this.updateShader();
    return this;
  };

  App.prototype.byId = function(id) {
    return document.getElementById(id);
  };

  App.prototype.extend = function(object, properties) {
    var key, val;
    for (key in properties) {
      val = properties[key];
      object[key] = val;
    }
    return object;
  };

  return App;

})();

this.shdr.App = App;
