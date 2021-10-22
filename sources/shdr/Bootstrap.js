
if (!$ || !shdr || !shdr.App) {
  console.warn("Unable to start Shdr, please load required libraries first.");
} else {
  $((function(_this) {
    return function() {
      return _this.app = new shdr.App("editor", "viewer");
    };
  })(this));
}

