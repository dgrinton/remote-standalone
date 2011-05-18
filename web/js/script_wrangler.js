var ScriptWrangler = function()
{
    var id = 1;
    var start_state = new Hash();
    var start_state_per_script = new Hash();
    var framework_scripts = new Array();
    var firstload_finished = false;
    var DEV = false;

    var callbacks = new Array();

    var tmp_start_state;

    var _pub =
    {
        init: function()
        {
            for(var p in window)
                start_state.set(p,true);

            $$('script').each(function(script)
            {
                framework_scripts.push(script);
            });
            if(window.Remote && Remote.dev())
                DEV = true;
        },

        load: function(scripts)
        {
            var new_scripts = new Array();
            scripts.each(function(script)
            {
                new_scripts.push(script.path);
            });

            reset(new_scripts);
            var prev = null;
            var first = null;

            scripts.each(function(script)
            {
                //look for an existing node with our path and the run once flag
                //set:
                if($$('script[src="'+script.path+'"]').length)
                    return;

                var node = new Element('script',{
                    src:script.path,
                    type:'text/javascript',
                    id:'node_'+(id++)
                });

                node.real_src = script.path;
                if(script.runOnce)
                    node.run_once = true;

                if(navigator.userAgent.toLowerCase().indexOf('msie') != -1)
                    node.onreadystatechange = function()
                    {
                        if(this.readyState == 'complete' || this.readyState == 'loaded')
                            chainLoad.bind(node)();
                    };
                else
                    node.onload = chainLoad.bind(node);

                if(!first)
                    first = node;

                if(prev)
                    prev.next_node = node;
                prev = node;
            });
            if(first)
            {
                if(first.run_once)
                    beginCollection();
                $$('head')[0].insert(first);
            }
            else
                execCallbacks();
        },

        whenDone: function(callback,first_only)
        {
            //Remote.debug('addwhendone');
            try
            {
            if(first_only && firstload_finished)
                callback();
            else
                callbacks.push(callback);
            }
            catch(e)
            {
                if(DEV)
                    alert('whendone callback caused exception:'+"\n"+e+"\n"+callback);
            }
        },

        registerVar: function(name)
        {
            start_state.set(name,true);
        },

        deRegisterVar: function(name)
        {
            start_state.unset(name);
        }
    };

    var beginCollection = function()
    {
        tmp_start_state = new Hash();
        for(var p in window)
            if(window[p] != undefined)
                tmp_start_state.set(p,true);
    };

    var endCollection = function(id)
    {
        var per_script = new Hash();
        for(var p in window)
        {
            if(!tmp_start_state.get(p) && window[p] != undefined)
            {
                per_script.set(p,true);
                ScriptWrangler.registerVar(p);
            }
        }
        start_state_per_script.set(id,per_script);
    };

    var chainLoad = function()
    {
        if(this.loaded)
            return;
        this.loaded = true;

        if(this.run_once)
            endCollection(this.identify());
        var next = this.next_node;
        if(next)
        {
            if(next.run_once)
                beginCollection();
            $$('head')[0].insert(next);
        }
        else
        {
            firstload_finished = true;
            //setTimeout(execCallbacks,200);
            execCallbacks();
        }
    };

    var execCallbacks = function()
    {
        //Remote.debug('exec whendones');
        callbacks.each(function(callback)
        {
            try
            {
                callback();
            }
            catch(e)
            {
                if(DEV)
                    alert('whendone callback caused exception:'+"\n"+e+"\n"+callback);
            }
        });
        callbacks = new Array();
    };

    var reset = function(new_scripts)
    {
        for(var p in window)
        {
            if(window[p] != undefined)
            {
                var keep = false;
                if(!start_state.get(p))
                {
                    start_state_per_script.each(function(pair)
                    {
                        if(pair.value.get(p))
                            keep = true;
                    });
                }
                else
                    keep = true;
                if(!keep)
                {
                    if(window[p] != window.location)
                        window[p] = undefined;
                }
            }
        }

        $$('script').each(function(script)
        {
            if(framework_scripts.indexOf(script) == -1)
            {
                //if(!ignore_runonce && script.run_once)
                if(script.run_once)
                {
                    if(new_scripts.indexOf(script.real_src) == -1)
                    {
                        start_state_per_script.get(script.id).each(function(pair)
                        {
                            window[pair.key] = undefined;
                            ScriptWrangler.deRegisterVar(pair.key);
                        });
                        start_state_per_script.unset(script.id);
                        script.remove();
                    }
                }
                else
                    script.remove();
            }
        });
    };

    return _pub;
}();
ScriptWrangler.init();
