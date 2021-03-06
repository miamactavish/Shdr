
var Validator = (function() {
  Validator.FRAGMENT = null;

  Validator.VERTEX = null;

  function Validator(canvas) {
    var e;
    this.canvas = canvas;
    console.dir(canvas);
    this.available = true;
    if (!this.canvas) {
      this.canvas = document.createElement('Canvas');
    }
    try {
      this.context = this.canvas.getContext("webgl2");
    } catch (error1) {
      e = error1;
      console.log(e);
    }
    console.log(this.context);
    if (!this.context) {
      this.available = false;
      console.warn('GLSL Validator: No WebGL context.');
    } else {
      Validator.FRAGMENT = this.context.FRAGMENT_SHADER;
      Validator.VERTEX = this.context.VERTEX_SHADER;
    }
  }

  Validator.prototype.validate = function(source, type) {
    var details, e, error, i, j, len, line, lines, log, message, shader, status;
    if (type == null) {
      type = Validator.FRAGMENT;
    }
    if (!this.available || !source) {
      return [true, null, null];
    }
    try {
      shader = this.context.createShader(type);
      this.context.shaderSource(shader, source);
      this.context.compileShader(shader);
      status = this.context.getShaderParameter(shader, this.context.COMPILE_STATUS);
    } catch (error1) {
      e = error1;
      return [false, 0, e.getMessage];
    }
    if (status === true) {
      return [true, null, null];
    } else {
      log = this.context.getShaderInfoLog(shader);
      this.context.deleteShader(shader);
      lines = log.split('\n');
      for (j = 0, len = lines.length; j < len; j++) {
        i = lines[j];
        if (i.substr(0, 5) === 'ERROR') {
          error = i;
        }
      }
      if (!error) {
        return [false, 0, 'Unable to parse error.'];
      }
      details = error.split(':');
      if (details.length < 4) {
        return [false, 0, error];
      }
      line = details[2];
      message = details.splice(3).join(':');
      return [false, parseInt(line), message];
    }
  };

  return Validator;

})();

window.shdr.Validator = Validator;
