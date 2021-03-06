// Configure URL routes for scale selection
define([
    'backbone',
    'app/model'
], function (Backbone, model) {
    'use strict';

    var AppRouter = Backbone.Router.extend({
        routes: {
            '!/:side/:direction/scale/:key/:mode': 'selectScale',
            '!/:side/:direction/chord/:key/:quality': 'selectChord',
            '!/:side/:direction': 'selectLayout'
        },
        selectLayout: function (side, direction) {
            model.set({
                'side': side,
                'direction': direction
            });
        },
        selectScale: function (side, direction, key, mode) {
            model.set({
                'side': side,
                'direction': direction,
                'key': key,
                'mode': mode,
                'quality': null
            });
        },
        selectChord: function (side, direction, key, quality) {
            model.set({
                'side': side,
                'direction': direction,
                'key': key,
                'mode': null,
                'quality': quality
            });
        }
    });
    return new AppRouter();
});
