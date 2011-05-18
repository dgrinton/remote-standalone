var first = true;
var RemoteHistory = function()
{
    var iframe_hack = false;
    var iframe_history = new Array();
    var ignore_load = false;

    var last_url = '';
    var change_check_timeout = 3000;
    var change_check_ref;
    var change_callback;

    var _pub = {
        init: function(callback)
        {
            //alert('init');
            //check if browser is IE, if so we need to iframe hax
            if(navigator.userAgent.toLowerCase().indexOf('msie') != -1)
                iframe_hack = true;

            change_callback = callback;
            last_url = window.location.toString();

            JsRegister.addOnload(function(){
                if(iframe_hack)
                {
                    ignore_load = true;
                    initIFrame();
                }
                else
                    checkForChange();
                addDebug();
            });
        },

        add: function(loc)
        {
            //alert('add ' + loc);
            var parts = window.location.toString().split('#');
            var new_url = parts[0] + '#' + loc;
            if(iframe_hack)
            {
                iframe_history = iframe_history.slice(0,historyNum()+1);
                iframe_history.push(new_url);
                ignore_load = true;
                window.ajaxnav.location =
                'packages/remote/mock-page.php?hash='+(iframe_history.length-1);
            }
            window.location = new_url;
        },

        disable: function()
        {
            if(change_check_ref)
                clearTimeout(change_check_ref);
            change_check_ref = null;
        },

        enable: function()
        {
            debug('enabled');
            if(iframe_hack)
            {
                last_url = iframe_history[historyNum()];
                if(last_url.indexOf('#') == -1)
                    last_url += '#';
                window.location = last_url;
            }
            else
                last_url = window.location.toString();
            checkForChange();
        },

        signalLoad: function(url)
        {
            if(ignore_load)
            {
                ignore_load = false;
                return;
            }
            change_callback(url);
        }

    };

    var addDebug = function()
    {
        var debug = new Element('div',{id:'history_debug'}).setStyle({
            position:'fixed',
            left:'0px',
            top:'0px',
            width:'100%',
            maxHeight:'200px',
            overflow:'auto',
            //display:'none',
            background:'white'
        });
        var btn = new Element('button').update('pause');
        btn.observe('click',function()
        {
            if(btn.state == 'paused')
            {
                btn.state = 'unpaused';
                btn.update('pause');
            }
            else
            {
                btn.state = 'paused';
                btn.update('unpause');
            }
        });
        debug.insert(btn);
        document.body.insert(debug);
    };

    var debug = function(text)
    {
        var d = new Date();
        var div = $('history_debug');
        if(!div)
            return;
        if(div.down('button').state == 'paused')
            return;
        div.insert(new Element('p').update(d + ' ' + text));
        /*
        if(div.select('p').length > 6)
            div.down('p').remove();
        */
    };

    var initIFrame = function()
    {
        /*
        if(first)
            alert('first');
        alert('iframe init');
        */
        first = false;
        var iframe = new Element('iframe',{
            id:'ajaxnav',
            name:'ajaxnav',
            src:'packages/remote/mock-page.php?hash=0'
        });
        //}).hide();
        var body = $$('body')[0];
        $$('body')[0].insert(iframe);
        //var loc = window.location.toString();
        //var parts = loc.split('#');
        //iframe_history.push(parts[0]);
        var first_hist = window.location.toString();
        iframe_history.push(first_hist);
        ScriptWrangler.registerVar('ajaxnav');
    };

    var historyNum = function()
    {
        var loc = window.ajaxnav.location.toString();
        var num = loc.substr(loc.indexOf('hash=')+5);
        //debug(' histnum ' + loc + ' ' + loc.indexOf('hash=') + ' ' + num + ' ' + iframe_history);
        return num;
    };

    var checkForChange = function()
    {
        if(change_check_ref)
            clearTimeout(change_check_ref);
        change_check_ref = null;
        var ret;
        var cur_url;
        if(iframe_hack)
            cur_url = iframe_history[historyNum()];
        else
            cur_url = window.location.toString();

        if(cur_url.indexOf('#') == -1)
            cur_url += '#';
        if(last_url.indexOf('#') == -1)
            last_url += '#';

        //debug(cur_url + ' ' + last_url);

        if(cur_url && cur_url != last_url)
            change_callback(cur_url.replace('#','?'));
        else
            change_check_ref = setTimeout(checkForChange,change_check_timeout);
    };

    return _pub;
}();
