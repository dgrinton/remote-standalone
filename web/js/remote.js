var Remote = function()
{
    var url_param = 'ajax';
    var debug_hax = new Array();
    var DEV = false;
    var remoteNumber;
    var uploadDir;
    var firstLoad = true;
    var cancelLoad = false;
    var css = new Array();
    var requests = new Array();
    var css_conditions
    var ignore_rsh = false;
    var timeouts = new Array();
    var rdr_url = null;
    var halted = false;
    var onreturns = new Array();
    var before_loads = new Array();
    var furnisher = 'index.php';

    var _pub = 
    {
        dev: function()
        {
            return DEV;
        },

        initAfterLoad: function()
        {
            if(firstLoad)
                addAnchorListeners(document.body);

            //setup onclick listeners on forms
            RemoteForm.initForms();

            initCss();

            //inspect url for '#' and trigger an ajax load if necessary
            if(firstLoad)
            {
                var url = window.location.toString();
                if(url.indexOf('#') != -1 && url.split('#')[1] != '')
                {
                    var base = url.split('#')[0];
                    var args = url.split('#')[1].split('&');
                    if(args.indexOf('transition') == -1)
                    {
                        var cover = new Element('div',{id:'_remote_cover'});
                        cover.setStyle(
                        {
                            display:'block',
                            width:'100%',
                            height:'100%',
                            background:'white',
                            position:'absolute',
                            left:'0px',
                            top:'0px',
                            zIndex:'9999'
                        });
                        document.body.insert(cover);
                        ajaxLoad(furnisher+'?'+url.split('#')[1]);
                    }
                    else
                    {
                        ignore_rsh = true;
                        var get_str = '';
                        args.each(function(arg)
                        {
                            if(arg != 'transition')
                            {
                                if(get_str)
                                    get_str += '&';
                                get_str += arg;
                            }
                        });
                        var new_url = base;
                        if(get_str)
                            new_url += '#' + get_str;
                        window.location = new_url;
                    }
                }
                else if(rdr_url)
                {
                    ajaxLoad(rdr_url);
                }
                else
                {
                    var parts = url.split('?');
                    var to_load = url;
                    if(parts.length == 1)
                        to_load += '?no_reply=true';
                    else
                        to_load += '&no_reply=true';

                    ajaxLoad(to_load);
                }

                firstLoad = false;
                if(DEV)
                    createDebugDiv();
            }
        },

        initBeforeLoad: function(remote_num,upload_dir,rdr)
        {
            rdr_url = rdr;
            remoteNumber = remote_num;
            RemoteForm.setUploadDir(upload_dir);
            RemoteForm.setSessId(remote_num);
            //if the page loads on anything other than index.php redirect
            var url = window.location.toString();
            /*
            if(url.indexOf('?') != -1)
                window.location = url.replace('?','#');
            */

            Event.observe(window,'load',function(){
                dhtmlHistory.initialize();
                dhtmlHistory.addListener(function(newLocation, historyData)
                {
                    if(ignore_rsh)
                    {
                        ignore_rsh = false;
                        return;
                    }
                    var url = furnisher;
                    if(newLocation)
                        url += '?' + newLocation;
                    ajaxLoad(url);
                });
            });
            //RemoteHistory.init(ajaxLoad);
        },

        ajaxLoad: function(url)
        {
            ajaxLoad(url);
        },

        cancel: function()
        {
            cancelLoad = true;
        },

        debug: function(text)
        {
            if(DEV)
            {
                var div = $('debug');
                if(div)
                {
                    var d = new Date();
                    text += ' '+d.getHours()+':'+d.getMinutes()+':'+d.getSeconds();
                    if(div.select('p').length > 15)
                        div.down('p').remove();
                    div.insert(new Element('p').update(text));
                }
                else
                    debug_hax.push(text);
            }
        },

        addRSHListener: function()
        {
            dhtmlHistory.addListener(function(newLocation,historyData)
            {
                ajaxLoad(furnisher+'?'+newLocation);
            });
        },

        formSubmit: function(form)
        {
            cancelRequests();
            clearTimeouts();
            if(window.location.toString().indexOf('?') == -1)
            {
                if(form.action.indexOf('?') !== -1) {
                    var url = form.action + '&'+url_param+'=true&remote_num='+remoteNumber;
                }
                else {
                    var url = form.action + '?'+url_param+'=true&remote_num='+remoteNumber;
                }

                var r = new Ajax.Request(url,{
                    onSuccess:function(transport){
                        ajaxUpdate(transport,form);
                    },
                    parameters:form.serialize(true)
                });
                
                requests.push(r);

                if(window.startRemoteLoading)
                    window.startRemoteLoading();
            }
            else
                formHaxLoad(form);
        },

        //force: load this anchor even though it has the no_remote class
        //specified
        //override_hax: do a regular ajax load even though we dont appear to be
        //in remote mode
        simClick: function(anchor,force,override_hax)
        {
            Element.extend(anchor);
            if(force || !anchor.hasClassName('no_remote'))
            {
                if(window.location.toString().indexOf('?') == -1 || override_hax)
                    execClick(anchor.href);
                else
                    haxLoad(anchor.href);
            }
            return false;
        },

        setTimeout: function(callback,timeout)
        {
            timeouts.push(setTimeout(callback,timeout));
        },

        //dont process any further ajaxupdates - useful if you're about to close
        //the window and dont want it to change before you do
        halt: function()
        {
            halted = true;
        },

        //add a callback that will be executed when ajaxUpdate next runs
        addOnReturn: function(callback)
        {
            onreturns.push(callback);
        },

        fireOnReturns: function(transport)
        {
            onreturns.each(function(callback)
            {
                try
                {
                    callback(transport);
                }
                catch(e)
                {
                    if(Remote.dev())
                        alert('onreturn callback threw exception: ' + e +
                        '\n' + callback);
                }
            });
        },

        clearOnReturns: function()
        {
            onreturns = new Array();
        },

        addBeforeLoad: function(callback)
        {
            before_loads.push(callback);
        },

        clearBeforeLoads: function()
        {
            before_loads = new Array();
        }
    };

    var clearTimeouts = function()
    {
        timeouts.each(function(t)
        {
            clearTimeout(t);
        });
        timeouts = new Array();
    };

    var ieVersionCheck = function(desired)
    {
        var ret = false;
        desired = desired.replace(/\W+/g,' ');
        desired = desired.replace(/^\W*/,'').replace(/\W*$/,'');
        var parts = desired.toLowerCase().split(' ');
        var match = navigator.appVersion.match(/MSIE (\d+)(\.\d+)?/);
        var version = null;
        if(match)
        {
            var str = match[1];
            if(match.length == 3)
                str += match[2];
            version = parseFloat(str);
        }
        if(parts.length == 1)
        {
            if(version)
                ret = true;
        }
        else if(parts.length == 2)
        {
            if(version == parts[1])
                ret = true; 
        }
        else if(parts.length == 3)
        {
            var op = null;
            if(parts[0] == 'lt')
                op = '<';
            else if(parts[0] == 'lte')
                op = '<=';
            else if(parts[0] == 'gt')
                op = '>';
            else if(parts[0] == 'gte')
                op = '>=';
            if(op && version)
                eval('ret = (version' + op + parts[2]+')');
        }
        return ret;
    };

    var haxLoad = function(url)
    {
        new Ajax.Request(furnisher+'?h=HaxLoad',{
            onSuccess:function(transport)
            {
                var target = url.replace('?','#') + '&transition';
                window.location = target;
            },
            parameters:{target:url.split('?')[1]}
        });
    };

    var formHaxLoad = function(form)
    {
        var params = form.serialize(true);
        params._remote_formhax_target = form.action.split('?')[1];
        new Ajax.Request(furnisher+'?h=HaxLoad',{
            onSuccess:function(transport)
            {
                var target = form.action.replace('?','#') + '&transition';
                window.location = target;
            },
            parameters:params
        });
    };

    var createDebugDiv = function()
    {
        Element.extend(document.body);
        if(document.body.insert)
        {
            document.body.insert(new Element('div',{id:'debug'}));
            $('debug').setStyle({
                'fontSize':'6pt',
                'zIndex':9999,
                position:'fixed',
                display:'block',
                width:'500px',
                height:'200px',
                background:'white',
                border:'1px solid black',
                left:0,
                top:0
                //opacity:'0.5'
            });
            $('debug').insert(new
                Element('button',{id:'hide_debug'}).update('hide'));
            $('hide_debug').observe('click',function() { $('debug').hide(); });
            $('hide_debug').setStyle({'float':'right'});
            debug_hax.each(Remote.debug);
            new Draggable('debug');
        }
        else
            setTimeout(createDebugDiv,200);
    };

    var addHistory = function(url)
    {
        var loc = null;
        var base = null;
        var separator = null;
        if(url.indexOf('?') != -1)
            separator = '?';
        else if(url.indexOf('#') != -1)
            separator = '#';

        if(separator)
            loc = url.split(separator)[1];
        else
            loc = '__root';

        dhtmlHistory.add(loc,null);
        //RemoteHistory.add(loc);
    };

    var ajaxUpdate = function(transport,form)
    {
        try
        {
            if(transport.responseText.replace(/^\s*|\s*$/g,''))
            {
                var jsonml_errors = new Array();
                var el;
                var static_js = new Array();
                var dyn_js = null;
                var new_css = null;

                reset();

                var update_components = transport.responseText.evalJSON();

                if(form)
                {
                    var validated = false;
                    update_components.each(function(update)
                    {
                        if(update.id == '' && update.attribute ==
                            'form_validated')
                            validated = update.value;
                    });
                    RemoteForm.fireOnReturns(form,transport,validated);
                }
                else
                {
                    Remote.fireOnReturns(transport);
                }

                if(halted)
                    return;

                update_components.each(function(update)
                {
                    if(update.id == '' && update.attribute == 'get_str')
                    {
                        var parts = window.location.toString().split('#');
                        var new_loc = parts[0] + '#' + update.value;
                        if(new_loc != window.location.toString())
                        {
                            ignore_rsh = true;
                            window.location = new_loc;
                        }
                    }
                    else if(update.id == 'site_template_view_node')
                    {
                        rebuildPage(update.value);
                    }
                    else if(update.id == '' && update.attribute == 'dyn_js')
                    {
                        dyn_js = update.value;
                    }
                    else if(update.id == '' && update.attribute == 'static_js')
                    {
                        static_js = update.value;
                    }
                    else if(update.id == '' && update.attribute == 'css')
                    {
                        new_css = JsonML.parse(update.value);
                    }
                    else if(update.id == '' && update.attribute == 'form_validated')
                    {
                    }
                    else if(el = $(update.id))
                    {
                        if(!update.value)
                        {
                            jsonml_errors.add(update.id);
                        }
                        else if (update.attribute == 'innerHTML')
                        {
                            replace(el,update.value);
                        }
                        else if(update.attribute == 'style')
                        {
                            var styles = new Object();
                            update.value.split(';').each(function(style)
                            {
                                if(!style) return;
                                var parts = style.split(':');
                                styles[parts[0].camelize()] = parts[1];
                            });
                            el.setStyle(styles);
                        }
                        else if(update.attribute == 'onclick')
                        {
                            if(DEV)
                                alert('you tried to use onclick for element '+update.id+
                                    ', use JsRegister::current->addRule() instead!');
                        }
                        else
                        {
                            el.writeAttribute(update.attribute,update.value);
                        }
                    }
                    else if(update.id == 'title')
                    {
                        document.title = update.value;
                    }
                    else if(DEV)
                    {
                        alert('dont know what to do with ' + update.id);
                    }
                });
                if(DEV && jsonml_errors.length)
                    alert('jsonml encoding errors in: '
                        +String.join(',',jsonml_errors));

                if(new_css != null)
                {
                    try
                    {
                    setCss(new_css);
                    }
                    catch(e)
                    {
                        alert('exception in setCss: ' + e);
                    }
                }

                if(dyn_js != null)
                {
                    try
                    {
                        eval(dyn_js);
                    }
                    catch(e)
                    {
                        if(DEV)
                            alert('dyn js caused exception'+"\n"+e+"\n"+dyn_js);
                    }
                }

                //re-run onload js of all registered scripts
                ScriptWrangler.whenDone(JsRegister.fakeOnload);

                ScriptWrangler.load(static_js);
                Remote.initAfterLoad();
            }

            //RemoteHistory.enable();
        }
        catch(e)
        {
            if(DEV)
                alert('uncaught exception in ajaxUpdate: ' + e);
        }
        var cover = $('_remote_cover');
        if(cover)
            cover.remove();
        if(window.finishRemoteLoading)
            window.finishRemoteLoading();
    };

    var rebuildPage = function(content)
    {
        if(!content)
        {
            if(DEV)
                alert('jsonml encoding error in site template');
        }
        else
        {
            var fragment = JsonML.parse(content);
            //fragment.select('script').each(Element.remove);
            document.body.descendants().each(function(d){d.stopObserving();});
            document.body.innerHTML = fragment.down('body').innerHTML;
            addAnchorListeners(document.body);
            $$('head').first().innerHTML = fragment.down('head').innerHTML;
            initCss();
        }
    };

    var replace = function(el,response)
    {
        var content = JsonML.parse(response);
        //this is kind of a hack to remove the listeners added by
        //addAnchorListeners (which cant use remoteObserve because then there'd
        //be a gap where the element wasnt covered)
        el.descendants().each(function(d){d.stopObserving();});
        while(el.firstChild)
            el.removeChild(el.firstChild);
        while(content.firstChild)
            el.appendChild(content.firstChild);
        addAnchorListeners(el);
    };

    var addAnchorListeners = function(node)
    {
        node = Element.extend(node);
        node.select('a.remote_exec').each(function(a)
        {
            a.observe('click',function(ev)
            {
                if(!Remote.simClick(a))
                    ev.stop();
            });

        });
    };

    var setCss = function(container)
    {
        var head = $$('head').first();

        var to_remove_array = $$('style');
        //var to_remove_array = new Array();
        var to_remove_hash = new Hash();
        css.each(function(node)
        {
            if(node.nodeType == 1)
            {
                Element.extend(node);
                node.identify();
            }

            if(node.nodeType == 1 && node.match('link[rel="stylesheet"]'))
                to_remove_hash.set(node.href,node);
            else
                to_remove_array.push(node);
        });

        css = new Array();

        //add new css
        var suppress = false;
        while (container.firstChild)
        {
            var to_add = container.firstChild;
            if(to_add.nodeType == 1)
                Element.extend(to_add);
            
            var existing = null;
            if(to_add.nodeType == 1 &&
                to_add.match('meta[name="ws_remote"].conditional_css'))
            {
                var match = null;
                var text = to_add.readAttribute('value');
                if (text.indexOf('endif') != -1)
                    suppress = false;
                else if(match = text.match(/\[if ([^\]]+)\]/))
                    suppress = !ieVersionCheck(match[1]);
                to_add.remove();
            }
            else if(!suppress)
            {
                if(to_add.nodeType == 1 && to_add.match('link[rel="stylesheet"]') &&
                    (existing = to_remove_hash.get(to_add.href)))
                {
                    to_remove_hash.unset(to_add.href);
                    css.push(existing);
                    to_add.remove();
                }
                else
                {
                    head.insert(to_add);
                    css.push(to_add);
                }
            }
            else if(to_add.parentNode)
            {
                to_add.parentNode.removeChild(to_add);
            }
        }

        to_remove_array.concat(to_remove_hash.values()).each(function(node)
        {
            if(node.parentNode)
            {
                if(node.remove)
                    node.remove();
                else
                    node.parentNode.removeChild(node);
            }
        });
    };

    initCss = function()
    {
        var start = $$('meta.remote_start_css').first();
        var finish = $$('meta.remote_finish_css').first();
        if(start && finish)
        {
            var node = start.nextSibling;
            while(node != finish)
            {
                css.push(node);
                node = node.nextSibling;
            }
            start.remove();
            finish.remove();
        }
    };

    var execClick = function(url)
    {
        cancelRequests();
        JsRegister.cancelTimeouts();

        addHistory(url);

        ajaxLoad(url);
    };

    var cancelRequests = function()
    {
        requests.each(function(request)
        {
            request.transport.abort();
        });
        requests = new Array();
    };

    var ajaxLoad = function(url)
    {
        execBeforeLoads();
        Remote.clearBeforeLoads();
        clearTimeouts();
        //RemoteHistory.disable();

        if(url.indexOf('?') == -1)
            url += '?'+url_param+'=1';
        else
            url += '&'+url_param+'=1';

        url += '&remote_num='+remoteNumber;

        var r = new Ajax.Request(url,{
            method:'get',
            onSuccess:ajaxUpdate
        });

        requests.push(r);

        if(window.startRemoteLoading)
            window.startRemoteLoading();
    };

    var execBeforeLoads = function()
    {
        //stupid ibox hack
        $$('#ibox').each(Element.remove);
        before_loads.each(function(callback)
        {
            try
            {
                callback();
            }
            catch(e)
            {
                if(DEV)
                    alert('beforeAjaxLoad callback caused exception ' + e +
                    '\n' + callback);
            }
        });
    };

    var reset = function()
    {
        RemoteUtils.removeListeners();
    };

    return _pub;
}();

var RemoteUtils = function()
{
    var listeners = new Array();

    var methods = 
    {
        //add a listener and keep track of it for later removal
        remoteObserve: function(el,ev,callback)
        {
            Event.observe(el,ev,callback);
            listeners.push({el:el,ev:ev,callback:callback});
            return el;
        }
    };

    var _pub = 
    {
        init: function()
        {
            Element.addMethods(methods);
        },

        removeListeners: function()
        {
            listeners.each(function(l)
            {
                Event.stopObserving(l.el,l.ev,l.callback);
            });
            listeners = new Array();
        }
    };

    return _pub;
}();

RemoteUtils.init();
Event.observe(window,'load',Remote.initAfterLoad);
