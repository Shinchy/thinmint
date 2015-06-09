ThinMint.Mixin.Paginate = function() {

  var _super = {};

  _super.init = ThinMint.Util.callback( this.init );
  _super.getPage = ThinMint.Util.callback( this.getPage );
  _super.getPages = ThinMint.Util.callback( this.getPages );
  _super.pageNext = ThinMint.Util.callback( this.pageNext );
  _super.pagePrevious = ThinMint.Util.callback( this.pagePrevious );
  _super.pageTo = ThinMint.Util.callback( this.pageTo );
  _super.onPage = ThinMint.Util.callback( this.onPage );

  // The first page, cannot paginate before this page.
  this.pageFirst = 1;
  // The current page.
  this.page = 1;
  // How many pages are available.
  this.pages = 1;

  this.getPage = function() {
    return this.page;
  };
  this.getPages = function() {
    return this.pages;
  };
  this.pageNext = function() {
    if(this.page >= this.pages) {
      console.warn('ThinMint.Mixin.Paginate', 'Already at the max page.');
      return;
    }

    ++this.page;
    return this.onPage();
  };
  this.pagePrevious = function() {
    if(this.page <= this.pageFirst) {
      console.warn('ThinMint.Mixin.Paginate', 'Already at the first page.');
      return;
    }

    --this.page;
    return this.onPage();
  };
  this.pageTo = function(page) {
    page = parseInt(page);

    if(page >= this.pages
    || page <= this.pageFirst) {
      console.warn('ThinMint.Mixin.Paginate', 'Cannot go outside of the allowed pages.');
      return;
    }

    this.page = page;
    return this.onPage();
  };
  this.onPage = function() {
    // Each panel will imlement onPage, this is how it
    // will handle a page change.
    _super.onPage.apply(this, arguments);
  };

  return this;

};
