
$(function() {

  // Color codes for coloring the scale lines
  var scaleColors = ['orange', 'blue', 'red', 'green', 'orange', 'blue'];

  // Color codes for coloring the octaves
  var octaveColors = ['#bcf', '#fdc', '#cfc', '#fea'];

  octaveColors = ['#71a8d7', '#e37e7b', '#85ca85', '#e6cb84'];


  // Model
  // -----

  // Represents the bandoneon keyboard that can(!) have a
  // direction (open/close), a side (right/left) and key + mode
  var AppModel = Backbone.Model.extend({

    defaults: {
      direction: 'open',
      side: 'right',
      key: null,
      mode: null
    },

    validate: function(attrs) {
      // side: left, right
      if (attrs.side && _.indexOf(['left', 'right'], attrs.side) === -1) {
        return 'invalid side';
      }

      // direction: open, close
      if (attrs.direction && _.indexOf(['open', 'close'], attrs.direction) === -1) {
        return 'invalid direction';
      }

      // key: from Bandoneon.keys
      if (attrs.key && _.indexOf(Bandoneon.keys, attrs.key) === -1) {
        return 'invalid key';
      }

      // mode: from Bandoneon.modes
      if (attrs.mode && !Bandoneon.modes.hasOwnProperty(attrs.mode)) {
        return 'invalid mode';
      }

      return;
    }

  });

  var appModel = new AppModel();


  // Router
  // ------

  // Configure URL routes for scale selection
  var AppRouter = Backbone.Router.extend({

    routes: {
      '!/:side/:direction/scale/:key/:mode': 'selectScale',
      '!/:side/:direction/chord/:key/:quality': 'selectChord',
      '!/:side/:direction': 'selectLayout'
    },

    selectLayout: function(side, direction) {
      appModel.set({
        'side': side,
        'direction': direction
      });
    },

    selectScale: function(side, direction, key, mode) {
      appModel.set({
        'side': side,
        'direction': direction,
        'key': key,
        'mode': mode,
        'quality': null
      });
    },

    selectChord: function(side, direction, key, quality) {
      appModel.set({
        'side': side,
        'direction': direction,
        'key': key,
        'mode': null,
        'quality': quality
      });
    }

  });

  var appRouter = new AppRouter();


  // View
  // ----

  // Renders the keyboard to our container DIV via Raphaël.
  var AppView = Backbone.View.extend({

    paper: null,
    showOctaveColors: false,

    el: document.getElementById('container'),

    events: {
      'click #toggle-octavecolors': 'toggleOctaveColors'
    },

    // Initialie Raphaël and listen to changes
    initialize: function() {
      var self = this;
      this.paper = Raphael(this.el, 800, 450);
      this.render();
      this.model.bind('change', this.render, this);
      this.model.bind('change', function() {
        _.each(['key', 'mode', 'quality'], function(e) {
          $('#select-' + e + ' button').removeClass('btn-primary');
          $('#select-' + e + ' button[data-' + e + '="' + self.model.get(e) + '"]').addClass('btn-primary');
        });
      });
    },

    // Render button layout (with colored octaves)
    renderButtons: function(side, direction) {
      var layout = Bandoneon.layout[side][direction];

      for (var k in layout) {
        var label = k;
        var key = label[0];
        var labelDisplay = label[0];
        var octave = label[1];
        if (label[1] == '#') {
          octave = label[2];
          key += label[1];
        }
        if (octave == 0) labelDisplay = label[0].toUpperCase();
        if (label[1] == '#') labelDisplay += '♯';
        else if (label[1] == 'b') labelDisplay += '♭';
        if (octave == 1) labelDisplay += '';
        else if (octave == 2) labelDisplay += 'ʹ';
        else if (octave == 3) labelDisplay += 'ʹʹ';
        else if (octave == 4) labelDisplay += 'ʹʹʹ';

        var fill = (this.showOctaveColors ? octaveColors[octave % (octaveColors.length)] : 'white');

        this.paper.circle(layout[k][0] + 30, layout[k][1] + 30, 30)
          .attr({
            'stroke-width': 2, /* (label[0] === 'c') ? 3 : 1 */
            'fill': fill,
            'fill-opacity': 0.5
          });

        this.paper.text(layout[k][0] + 30, layout[k][1] + 30, labelDisplay)
          .attr({
            'font-family': 'serif',
            'font-size': 21,
            'font-style': 'italic',
            'cursor': 'default'
          });
      }
    },

    // Render a specific scale
    renderScale: function(side, direction, scale, color) {
      var layout = Bandoneon.layout[side][direction];
      if (!layout) return;

      var pathString = '';
      for (var t in scale) {
        if (layout.hasOwnProperty(scale[t])) {
          pathString += (pathString === '')?'M':'L';
          pathString += layout[scale[t]][0] + 30;
          pathString += ',';
          pathString += layout[scale[t]][1] + 30;
        }
      }

      if (pathString === '') return;

      return this.paper.path(pathString)
        .attr({
          'stroke': color,
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
          'stroke-width': 4,
          'stroke-opacity': 0.66
        });
    },

    // Render a chord (left side only)
    renderChord: function(side, direction, key, quality) {
      if (! Bandoneon.chords[side][direction][quality]) return;

      var chord = Bandoneon.chords[side][direction][quality][key];
      if (!chord) return;
      
      var layout = Bandoneon.layout[side][direction];
      if (!layout) return;

      for (var k in layout) {
        if (_.indexOf(chord, k) === -1) continue;
        var label = k;
        this.paper.circle(layout[k][0] + 30, layout[k][1] + 30, 28)
          .attr({
            'stroke-width': 4,
            'fill': 'black',
            'fill-opacity': 0.33
          });
      }
    },

    // Render the whole layout with buttons, octaves and scale
    render: function() {
      var side = this.model.get('side');
      var direction = this.model.get('direction');
  
      if (!side || !direction) return;

      this.paper.clear();
      this.renderButtons(side, direction);

      $('#nav-sides a[href="#' + side + '-' + direction + '"]').tab('show');

      var key = this.model.get('key');
      var mode = this.model.get('mode');
      var quality = this.model.get('quality');

      if (!key || (!mode && !quality)) {
        // render keyboard only
        appRouter.navigate('!/' + side + '/' + direction, {replace: true});
        return;
      }

      if (mode) {
        // render scale
        for (var o = -1; o < 5; o++) {
          var scale = Bandoneon.utils.scale(key, o, mode);
          scale.push(key + '' + (o + 1));
          this.renderScale(side, direction, scale, scaleColors[o + 1]);
        }

        appRouter.navigate('!/' + side + '/' + direction + '/scale/' +
          key + '/' + mode, {replace: true});
      } else if (quality) {
        // render chord
        this.renderChord(side, direction, key, quality);
        appRouter.navigate('!/' + side + '/' + direction + '/chord/' +
          key + '/' + quality, {replace: true});
      }

      return this;
    },

    // Toggle colored octaves and re-render
    toggleOctaveColors: function() {
      this.showOctaveColors = !this.showOctaveColors;
      this.render();
    }

  });

  var appView = new AppView({ model: appModel, router: appRouter });

  Backbone.history.start();

  // don't submit the form
  $('#scale-form').submit(function() {
    return false;
  });

  // octave color toggle
  $('#toggle-octavecolors').click(function() {
    appView.toggleOctaveColors();
    $('#toggle-octavecolors').button('toggle');
  });

  // key selection
  function selectKey(key, force) {
    if (!force && appModel.get('key') === key) {
      // unset key
      appModel.set('key', null);
    } else {
      appModel.set('key', key);
      if (!appModel.get('mode') && !appModel.get('quality')) {
        // set default mode if none is set yet
        appModel.set('mode', 'M');
      }
      //$(this).addClass('btn-primary');
    }
  }

  $('#select-key button').click(function() {
    selectKey($(this).data('key'));
  });

  // mode selection
  function selectMode(mode, force) {
    if (!force && appModel.get('mode') === mode) {
      // unset mode
      appModel.set('mode', null);
    } else {
      appModel.set('mode', mode);
      if (! appModel.get('key')) {
        // set default key if none is set yet
        appModel.set('key', 'c');
      }
    }
    // unset quality
    appModel.set('quality', null);
  }

  $('#select-mode button').click(function() {
    selectMode($(this).data('mode'));
  });

  // chord quality selection
  function selectQuality(quality, force) {
    if (!force && appModel.get('quality') === quality) {
      // unset quality
      appModel.set('quality', null);
    } else {
      appModel.set('quality', quality);
      if (! appModel.get('key')) {
        // set default key if none is set yet
        appModel.set('key', 'c');
      }
    }
    // unset mode
    appModel.set('mode', null);
  }

  $('#select-quality button').click(function() {
    selectQuality($(this).data('quality'));
  });

  // side / direction navigation
  $('#nav-sides a[data-toggle="tab"]').on('shown', function(e) {
    switch (e.target.hash) {
      case '#left-open':
        appModel.set({ 'side': 'left', 'direction': 'open' });
        break;
      case '#left-close':
        appModel.set({ 'side': 'left', 'direction': 'close' });
        break;
      case '#right-open':
        appModel.set({ 'side': 'right', 'direction': 'open' });
        break;
      case '#right-close':
        appModel.set({ 'side': 'right', 'direction': 'close' });
        break;
    }
  });

  // keypress events
  $('body').keypress(function(e) {
    switch (e.keyCode) {
      case 114: // r
        appModel.set({ 'side': 'right', 'direction': 'open' });
        break;
      case 82: // R
        appModel.set({ 'side': 'right', 'direction': 'close' });
        break;
      case 108: // l
        appModel.set({ 'side': 'left', 'direction': 'open' });
        break;
      case 76: // L
        appModel.set({ 'side': 'left', 'direction': 'close' });
        break;
      case 35: // #
        var key = appModel.get('key');
        if (key && (key.length === 1)) {
          appModel.set('key', key + '#');
        }
        break;
      case 67: // C
        appView.toggleOctaveColors();
        $('#toggle-octavecolors').button('toggle');
        break;
      case 77: // M
        selectQuality('M', true);
        break;
      case 109: // m
        selectQuality('m', true);
        break;
      case 55: // 7
        selectQuality('7', true);
        break;
      case 97:
      case 98:
      case 99:
      case 100:
      case 101:
      case 102:
      case 103:
        appModel.set('key', String.fromCharCode(e.keyCode));
        break;
    }
  });

  // debug
  window.appModel = appModel;
  window.appView = appView;

});
