window.dhtmlHistory.create({
    toJSON: function(o) { return Object.toJSON(o); },
    fromJSON: function(s) { return s.evalJSON(); }
});
