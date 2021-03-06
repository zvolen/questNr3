// Utility

(function(document, window) {
   'use strict';

   function buildUrl(url, parameters){
      var queryString = '';

      for(var key in parameters) {
         if (parameters.hasOwnProperty(key)) {
            queryString += encodeURIComponent(key) + '=' + encodeURIComponent(parameters[key]) + '&';
         }
      }

      if (queryString.lastIndexOf('&') === queryString.length - 1){
         queryString = queryString.substring(0, queryString.length - 1);
      }

      return url + '?' + queryString;
   }

   function extend(object) {
      for(var i = 1; i < arguments.length; i++) {
          for(var key in arguments[i]) {
             if (arguments[i].hasOwnProperty(key)) {
                object[key] = arguments[i][key];
             }
          }
      }

      return object;
   }

   window.Utility = {
      buildUrl: buildUrl,
      extend: extend
   };
})(document, window);

// Gallery

(function(document, window) {
   'use strict';

   function Gallery(photos, container) {
      this.currentIndex = 0;
      this.photos = photos;
      this.container = container;

      this.showPhoto(this.currentIndex);
   }

   Gallery.prototype.showPhoto = function(index) {
      if (index >= 0 && index < this.photos.length) {
         this.currentIndex = index;
         this.container.src = Flickr.buildPhotoLargeUrl(this.photos[this.currentIndex]);
      }
   };

   Gallery.prototype.showPrevious = function() {
      if (this.currentIndex > 0) {
         this.currentIndex--;
      }

      this.showPhoto(this.currentIndex);
   };

   Gallery.prototype.showNext = function() {
      if (this.currentIndex < this.photos.length - 1) {
         this.currentIndex++;
      }

      this.showPhoto(this.currentIndex);
   };

   Gallery.prototype.createThumbnailsGallery = function(container) {
      function clickHandler(index, gallery) {
         return function (event) {
            event.preventDefault();

            gallery.showPhoto(index);
         };
      }

      container.textContent = '';
      var image, link, listItem;
      for (var i = 0; i < this.photos.length; i++) {
         image = document.createElement('img');
         image.src = Flickr.buildThumbnailUrl(this.photos[i]);
         image.className = 'thumbnail';
         image.alt = this.photos[i].title;
         image.title = this.photos[i].title;

         link = document.createElement('a');
         link.href = image.src;
         link.addEventListener('click', clickHandler(i, this));
         link.appendChild(image);

         listItem = document.createElement('li');
         listItem.appendChild(link);

         container.appendChild(listItem);
      }
   };

   window.Gallery = Gallery;
})(document, window);

// Flickr

(function(document, window) {
   'use strict';

   var apiKey = '14dcb881f1626d06fa1616433314ce29';
   var apiURL = 'https://api.flickr.com/services/rest/';

   function searchText(parameters) {
      var requestParameters = Utility.extend(parameters, {
         method: 'flickr.photos.search',
         api_key: apiKey,
         format: 'json'
      });

      var script = document.createElement('script');
      script.src = Utility.buildUrl(apiURL, requestParameters);
      document.head.appendChild(script);
      document.head.removeChild(script);
   }

   function buildThumbnailUrl(photo) {
      return 'https://farm' + photo.farm + '.staticflickr.com/' + photo.server +
      '/' + photo.id + '_' + photo.secret + '_q.jpg';
   }

   function buildPhotoUrl(photo) {
      return 'https://farm' + photo.farm + '.staticflickr.com/' + photo.server +
             '/' + photo.id + '_' + photo.secret + '.jpg';
   }

   function buildPhotoLargeUrl(photo) {
      return 'https://farm' + photo.farm + '.staticflickr.com/' + photo.server +
      '/' + photo.id + '_' + photo.secret + '_b.jpg';
   }

   window.Flickr = Utility.extend(window.Flickr || {}, {
      buildThumbnailUrl: buildThumbnailUrl,
      buildPhotoUrl: buildPhotoUrl,
      buildPhotoLargeUrl: buildPhotoLargeUrl,
      searchText: searchText
   });
})(document, window);

// Main

(function(document, window) {
   'use strict';

   var gallery;
   var lastSearch = 'London';

   function searchPhotos(text, page) {
      if (text.length === 0) {
         alert('Error: the field is required');
      }
      page = page > 0 ? page : 1;

      Flickr.searchText({
         text: text,
         per_page: 15,
         jsoncallback: 'Website.Homepage.showPhotos',
         page: page
      });
   }

   function createPager(element, parameters) {
      var pagesToShow = 5;
      var url = '/search/' + parameters.query + '/';
      element.textContent = '';

      var previousLinks = {
         '&lt;&lt;': 1,
         '&lt;': (parameters.currentPage - 1 || parameters.currentPage)
      };

      for (var key in previousLinks) {
         link = document.createElement('a');
         link.href = url + previousLinks[key];
         link.innerHTML = '<span class="js-page-number visually-hidden">' + previousLinks[key] + '</span>' + key;
         var listItem = document.createElement('li');
         listItem.appendChild(link);
         element.appendChild(listItem);
      }

      // Avoid showing less than 6 pages in the pager because the user reaches the end
      var pagesDifference = parameters.pagesNumber - parameters.currentPage;
      var startIndex = parameters.currentPage;
      if (pagesDifference < pagesToShow) {
         startIndex = parameters.currentPage - (pagesToShow - pagesDifference - 1) || 1;
      }
      var link;
      for(var i = startIndex; i < parameters.currentPage + pagesToShow && i <= parameters.pagesNumber; i++) {
         link = document.createElement('a');
         link.href = url + i;
         link.innerHTML = '<span class="js-page-number">' + i + '</span>';
         if (i === parameters.currentPage) {
            link.className += ' current';
         }
         listItem = document.createElement('li');
         listItem.appendChild(link);
         element.appendChild(listItem);
      }

      var nextLinks = {
         '&gt;': (parameters.currentPage === parameters.pagesNumber ? parameters.pagesNumber : parameters.currentPage + 1),
         '&gt;&gt;': parameters.pagesNumber
      };

      for (key in nextLinks) {
         link = document.createElement('a');
         link.href = url + nextLinks[key];
         link.innerHTML = '<span class="js-page-number visually-hidden">' + nextLinks[key] + '</span>' + key;
         var listItem = document.createElement('li');
         listItem.appendChild(link);
         element.appendChild(listItem);
      }
   }

   function showPhotos(data) {
      createPager(
         document.getElementsByClassName('js-thumbnails__pager')[0], {
            query: lastSearch,
            currentPage: data.photos.page,
            pagesNumber: data.photos.pages
         }
      );

      gallery = new Gallery(data.photos.photo, document.getElementsByClassName('js-gallery__image')[0]);
      gallery.createThumbnailsGallery(document.getElementsByClassName('js-thumbnails__list')[0]);
   }

   function init() {
      document.getElementsByClassName('js-form-search')[0].addEventListener('submit', function(event) {
         event.preventDefault();

         lastSearch = document.getElementById('query').value;
         if (lastSearch.length > 0) {
            searchPhotos(lastSearch, 1);
         }
      });

      var leftArrow = document.getElementsByClassName('js-gallery__arrow--left')[0];
      leftArrow.addEventListener('click', function() {
         gallery.showPrevious.bind(gallery)();
      });
      leftArrow.addEventListener('keydown', function(event) {
         if (event.which === 13) {
            gallery.showPrevious.bind(gallery)();
         }
      });

      var rightArrow = document.getElementsByClassName('js-gallery__arrow--right')[0];
      rightArrow.addEventListener('click', function() {
         gallery.showNext.bind(gallery)();
      });
      rightArrow.addEventListener('keydown', function(event) {
         if (event.which === 13) {
            gallery.showNext.bind(gallery)()();
         }
      });

      document.getElementsByClassName('js-thumbnails__pager')[0].addEventListener('click', function(event) {
         event.preventDefault();
         var page;
         var currentLink = this.getElementsByClassName('current')[0];
         if (event.target.nodeName === 'SPAN') {
            page = event.target.textContent;
         } else if (event.target.nodeName === 'A') {
            page = event.target.getElementsByClassName('js-page-number')[0].textContent;
         }

         // Avoid reloading the same page
         if (page && page !== currentLink.getElementsByClassName('js-page-number')[0].textContent) {
            searchPhotos(lastSearch, page);
         }
      });

      // Kickstart the page
      searchPhotos(lastSearch, 1);
   }

   window.Website = Utility.extend(window.Website || {}, {
      Homepage: {
         init: init,
         showPhotos: showPhotos
      }
   });
})(document, window);

Website.Homepage.init();

