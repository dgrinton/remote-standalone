var JsRegister = function()
{
    var onloads = new Array();
    var rs_onloads = new Array();
    var rules = new Array();
    var inited = false;
    var timeouts = new Array();
    var DEV = false;

    var _pub = {
        configure: function(_rules,_rs_onloads)
        {
            //Remote.debug('configure');
            rules = _rules;
            rs_onloads = _rs_onloads;
        },

        addOnload: function(func)
        {
            //Remote.debug('addonload');
            onloads.push(func);
        },

        fakeOnload: function()
        {
            //Remote.debug('fakeonload');
            doOnloads();
        },

        init: function()
        {
            if(window.Remote && Remote.dev())
                DEV = true;
            Event.observe(window,'load',doOnloads);
        },

        observe: function(el,ev,callback)
        {
            if(window.Remote)
                Element.remoteObserve(el,ev,callback);
            else
                Event.observe(el,ev,callback);
        },

        setTimeout: function(callback, timeout)
        {
            timeouts.push(setTimeout(callback,timeout));
        },

        cancelTimeouts: function()
        {
            timeouts.each(clearTimeout);
            timeouts = new Array();
        }
    };

    var doOnloads = function()
    {
        //Remote.debug('realonload');
        onloads.each(function(func){
            try
            {
                func();
            }
            catch(e)
            {
                if(DEV);
                    alert('onload func caused an exception: '+e + ' ' + func);
            }
        });

        rs_onloads.each(function(code)
        {
            try
            {
                eval(code);
            }
            catch(e)
            {
                if(DEV)
                    alert('rs onload caused an exception: '+e + ' ' + code);
            }
        });

        onloads = new Array();
        
        rules.each(function(rule)
        {
            var matched = $$(rule.selector);
            matched.each(function(node)
            {
                var callback = function(ev)
                {
                    //need this wackiness because rule.func is a string
                    //cant use window[rule.func] because this wont work when
                    //rule.func contains eg "Object.function"
                    try
                    {
                        eval('func = ' + rule.func);
                        func(ev);
                    }
                    catch(e)
                    {
                        if(DEV)
                            alert('rule callback caused an exception: ' + e + ' ' + func);
                    }
                }
                if(node.remoteObserve)
                    node.remoteObserve(rule.trigger,callback);
                else
                    node.observe(rule.trigger,callback);
            });
        });
    };

    return _pub;
}();
JsRegister.init();
