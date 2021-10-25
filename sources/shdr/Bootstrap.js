
if (!$ || !window.shdr || !window.shdr.App) {
  console.warn("Unable to start Shdr, please load required libraries first.");
} else {
  $((function(_this) {
    return function() {
      return _this.app = new window.shdr.App("editor", "viewer");
    };
  })(this));
}

