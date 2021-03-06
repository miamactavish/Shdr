var UI = (function() {
  UI.ERROR = 0;

  UI.SUCCESS = 1;

  UI.WARNING = 2;

  UI.INFO = 3;

  function UI(app) {
    this.app = app;
    this.initStatus();
    this.initSnippets();
    this.initModels();
    this.initMenus();
    this.initToggles();
    this.initButtons();
    this.initBoxes();
    this.resetLoadFiles();
  }

  UI.prototype.hideMainLoader = function() {
    return $('#main-loader').fadeOut(400);
  };

  UI.prototype.showModelLoader = function() {
    return $('#model-loader').fadeIn(200);
  };

  UI.prototype.hideModelLoader = function() {
    return $('#model-loader').fadeOut(400);
  };

  UI.prototype.displayWebGLError = function() {
    return $('#main-loader div').text('WebGL support missing.');
  };

  UI.prototype.clearName = function(defaultName) {
    var menuname;
    this.inputs.savename.val(defaultName);
    menuname = $('#menu-name');
    if (menuname.is(':visible')) {
      menuname.fadeOut(200);
      return $('#menu-remove').fadeOut(200);
    }
  };

  UI.prototype.resetLoadFiles = function() {
    var d, i, len, ref, tpl;
    tpl = "";
    ref = window.shdr.Storage.listDocuments();
    for (i = 0, len = ref.length; i < len; i++) {
      d = ref[i];
      tpl += "<button type='button' class='menu-item' data-index='" + d + "'>" + d + "</button>\n";
    }
    return this.lists.files.html(tpl);
  };

  UI.prototype.initStatus = function() {
    var content, el, icon, span;
    el = $('#status');
    span = el.children('span');
    icon = span.children('i');
    content = span.children('b');
    return this.status = {
      container: el,
      span: span,
      icon: icon,
      content: content
    };
  };

  UI.prototype.initBoxes = function() {
    var objFile, shareurl, shortenurl, submitbutton, texfile;
    this.boxes = {
      upload: $('#box-upload'),
      texture: $('#box-texture'),
      share: $('#box-share'),
      about: $('#box-about')
    };
    $('.box .close').on('click', function(e) {
      return $(this).parent().fadeOut(200);
    });
    objFile = this.boxes.upload.find('#box-upload-input');
    submitbutton = this.boxes.upload.find('#box-upload-submit');
    submitbutton.on('click', (function(_this) {
      return function(e) {
        var inputFile;
        inputFile = objFile[0].files[0];
        _this.app.upload(inputFile);
        return _this.boxes.upload.fadeOut(200);
      };
    })(this));
    texfile = this.boxes.texture.find('#box-texture-input');
    submitbutton = this.boxes.texture.find('#box-texture-submit');
    submitbutton.on('click', (function(_this) {
      return function(e) {
        var inputTexture;
        inputTexture = texfile[0].files[0];
        console.log(inputTexture);
        _this.app.texture(inputTexture);
        return _this.boxes.texture.fadeOut(200);
      };
    })(this));
    shareurl = this.boxes.share.find('#box-share-url');
    shortenurl = this.boxes.share.find('#box-share-shorten');
    shareurl.on('click', function(e) {
      return $(this).select();
    });
    return shortenurl.on('click', (function(_this) {
      return function(e) {
        shortenurl.text('Wait...');
        return _this.app.shortenURL(shareurl.val(), function(status, url, resp) {
          if (status && url) {
            _this.boxes.share.find('#box-share-url').val(url);
          }
          return shortenurl.text('Shorten');
        });
      };
    })(this));
  };

  UI.prototype.initButtons = function() {
    this.inputs = {
      savename: $('#save-name')
    };
    this.inputs.savename.on('click', (function(_this) {
      return function(e) {
        e.stopPropagation();
        $(_this).focus();
        return false;
      };
    })(this));
    return $('.menu-button').on('click', (function(_this) {
      return function(e) {
        return _this.onButton(e);
      };
    })(this));
  };

  UI.prototype.initToggles = function() {
    return $('.menu-toggle').on('click', (function(_this) {
      return function(e) {
        return _this.onToggle(e);
      };
    })(this));
  };

  UI.prototype.initMenus = function() {
    $('.menu-trigger').on('click.on', (function(_this) {
      return function(e) {
        return _this.onMenuTrigger(e);
      };
    })(this));
    $(document).on('click', '.menu-item', (function(_this) {
      return function(e) {
        return _this.onMenuItem(e);
      };
    })(this));
    return this.lists = {
      files: $('#menu-load .menu-list'),
      models: $('#menu-models .menu-list')
    };
  };

  UI.prototype.initSnippets = function() {
    var button, key, list;
    list = $('#menu-snippets .menu-list');
    button = $('<button>').addClass('menu-item');
    for (key in window.shdr.Snippets) {
      list.append(button.clone().text(key));
    }
    return false;
  };

  UI.prototype.initModels = function() {
    var button, key, list, model, ref;
    list = $('#menu-models .menu-list');
    button = $('<button>').addClass('menu-item');
    ref = window.shdr.Models;
    for (key in ref) {
      model = ref[key];
      list.append(button.clone().text(model.name).attr('data-index', key));
    }
    return false;
  };

  UI.prototype.addNewModel = function(modelName, key) {
    console.log("modelName:");
    console.log(modelName);

    console.log(key);

    ref = window.shdr.Models;
    ref[key] = modelName;

    console.log("Models:");
    console.dir(ref);

    var button, list;
    list = $('#menu-models .menu-list');
    button = $('<button>').addClass('menu-item');
    return list.append(button.clone().text(modelName.charAt(0).toUpperCase() + modelName.split('.')[0].slice(1)).attr('data-index', key));
  };

  UI.prototype.setStatus = function(message, type) {
    if (type == null) {
      type = UI.ERROR;
    }
    this.status.span.removeClass();
    this.status.icon.removeClass();
    switch (type) {
      case UI.ERROR:
        this.status.span.addClass('status-error');
        this.status.icon.addClass('icon-exclamation-sign');
        break;
      case UI.SUCCESS:
        this.status.span.addClass('status-success');
        this.status.icon.addClass('icon-ok-sign');
        break;
      case UI.WARNING:
        this.status.span.addClass('status-warning');
        this.status.icon.addClass('icon-warning-sign');
        break;
      case UI.INFO:
        this.status.span.addClass('status-info');
        this.status.icon.addClass('icon-info-sign');
    }
    return this.status.content.text(message);
  };

  UI.prototype.setMenuMode = function(mode) {
    var el, item;
    el = $('#menu-mode');
    item = el.find("button[data-index=" + mode + "]");
    if (item) {
      el.find('.menu-trigger').children('span').text(item.text());
    }
    return mode;
  };

  UI.prototype.onToggle = function(event) {
    var el, ico, name, root, state;
    el = $(event.target);
    root = el.parent();
    ico = el.children('i');
    state = el.attr('data-current') === el.attr('data-off');
    if (state === true) {
      el.attr('data-current', el.attr('data-on'));
      ico.removeClass(ico.attr('data-off'));
      ico.addClass(ico.attr('data-on'));
    } else {
      el.attr('data-current', el.attr('data-off'));
      ico.removeClass(ico.attr('data-on'));
      ico.addClass(ico.attr('data-off'));
    }
    if (typeof this[name = root.attr('data-action') + 'Action'] === "function") {
      this[name](state, null, el);
    }
    return this.app.editor.focus();
  };

  UI.prototype.onButton = function(event) {
    var el, name, root;
    el = $(event.target);
    root = el.parent();
    if (typeof this[name = root.attr('data-action') + 'Action'] === "function") {
      this[name](null, null, el);
    }
    return el.blur();
  };

  UI.prototype.onMenuTrigger = function(event) {
    var el, list, root;
    el = $(event.target);
    root = el.parent();
    list = root.children('.menu-list');
    el.addClass('open');
    list.slideDown(200);
    $(document).on('click.menu-trigger', (function(_this) {
      return function() {
        return _this.offMenuTrigger(el, list);
      };
    })(this));
    el.off('click.on');
    el.on('click.off', (function(_this) {
      return function(e) {
        return _this.offMenuTrigger(el, list);
      };
    })(this));
    return event.stopPropagation();
  };

  UI.prototype.offMenuTrigger = function(el, list) {
    el.removeClass('open');
    el.off('click.off');
    el.blur();
    el.on('click.on', (function(_this) {
      return function(e) {
        return _this.onMenuTrigger(e);
      };
    })(this));
    list.slideUp(200);
    $(document).off('click.menu-trigger');
    return this.app.editor.focus();
  };

  UI.prototype.onMenuItem = function(event) {
    var el, index, item, list, name, root;
    item = $(event.target);
    list = item.parent();
    root = list.parent();
    el = root.children('.menu-trigger');
    index = item.attr('data-index');
    if (typeof this[name = root.attr('data-action') + 'Action'] === "function") {
      this[name](index, item, el);
    }
    this.offMenuTrigger(el, list);
    return event.stopPropagation();
  };

  UI.prototype.updateAction = function(index, item, trigger) {
    trigger.html(item.html());
    return this.app.setUpdateMode(index);
  };

  UI.prototype.snippetsAction = function(index, item, trigger) {
    var code;
    code = window.shdr.Snippets[item.text()];
    if (code != null) {
      return this.app.editor.insert(code);
    }
  };

  UI.prototype.modelsAction = function(index, item, trigger) {
    trigger.children('span').text(item.text());
    return this.app.viewer.loadModel(index);
  };

  UI.prototype.modeAction = function(index, item, trigger) {
    trigger.children('span').text(item.text());
    return this.app.setMode(index);
  };

  UI.prototype.rotateAction = function(state) {
    return this.app.viewer.rotate = state;
  };

  UI.prototype.resetAction = function() {
    return this.app.viewer.reset();
  };

  UI.prototype.shareAction = function() {
    var url;
    this.app.updateDocument();
    url = this.app.packURL();
    this.boxes.share.find('#box-share-url').val(url);
    return this.boxes.share.fadeIn(200);
  };

  UI.prototype.uploadAction = function() {
    var boxupload;
    this.app.updateDocument();
    boxupload = $('#box-upload');
    return this.boxes.upload.fadeIn(200);
  };

  UI.prototype.textureAction = function() {
    var boxupload;
    this.app.updateDocument();
    boxupload = $('#box-texture');
    return this.boxes.texture.fadeIn(200);
  };

  UI.prototype.downloadAction = function() {
    return this.app.download();
  };

  UI.prototype.aboutAction = function() {
    return this.boxes.about.fadeIn(200);
  };

  UI.prototype.helpAction = function() {
    var win;
    win = window.open('https://github.com/BKcore/Shdr/wiki/Help', '_blank');
    if (win) {
      return win.focus();
    } else {
      return this.ui.setStatus('Your browser as blocked the Help window, please disable your popup blocker.', window.shdr.UI.WARNING);
    }
  };

  UI.prototype.saveAction = function(_, __, el) {
    var menuname;
    menuname = $('#menu-name');
    if (!menuname.is(':visible')) {
      menuname.fadeIn(200);
      $('#menu-remove').fadeIn(200);
      this.inputs.savename.val('Untitled');
      return this.setStatus('Please enter a file name, then hit the save button once again.', UI.INFO);
    } else {
      return this.app.save(this.inputs.savename.val());
    }
  };

  UI.prototype.loadAction = function(index) {
    var exists, menuname;
    exists = this.app.load(index);
    console.log(exists);
    if (exists) {
      this.inputs.savename.val(index);
      menuname = $('#menu-name');
      if (!menuname.is(':visible')) {
        menuname.fadeIn(200);
        return $('#menu-remove').fadeIn(200);
      }
    }
  };

  UI.prototype.newAction = function(confirm) {
    if (confirm === "default") {
      return this.app["new"]();
    } else if (confirm === "demo") {
      return this.app.newDemo();
    }
  };

  UI.prototype.removeAction = function(confirm) {
    if (confirm === "confirm") {
      return this.app.remove(this.inputs.savename.val(), true);
    }
  };

  return UI;

})();


window.shdr.UI = UI;
