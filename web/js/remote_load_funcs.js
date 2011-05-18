var remote_cursor_changing = false;
var remote_cursor_restoring = false;
function startRemoteLoading()
{
    if(remote_cursor_changing)
        return;
    remote_cursor_changing = true;
    try
    {
        changeCursor('wait');
    }
    catch(e)
    {
        remote_cursor_changing = false;
    }
    remote_cursor_changing = false;
    /*
    document.body.insert(new Element('div').setStyle({
        display:'block',
        position:'fixed',
        left:'0px',
        top:'0px',
        width:'100%',
        height:'100%',
        background:'#fff'
    }).setOpacity(0.0).addClassName('loading_overlay'));
    */
}

function finishRemoteLoading()
{
    if(remote_cursor_restoring)
        return;
    remote_cursor_restoring = true;
    try
    {
        restoreCursor();
    }
    catch(e)
    {
        remote_cursor_restoring = false;
    }
    remote_cursor_restoring = false;
    //$$('div.loading_overlay').each(Element.remove);
}

function changeCursor(c)
{
    if(remote_cursor_restoring)
    {
        setTimeout('changeCursor(c)',100);
    }
    else
    {
        var n;
        for(n = 0; n < document.styleSheets.length;n++)
        {
            var rules = new Array();
            if(document.styleSheets[n].cssRules)
                rules = document.styleSheets[n].cssRules;
            else if(document.styleSheets[n].rules)
                rules = document.styleSheets[n].rules;
            
            for(m = 0;m < rules.length;m++)
            {
                if(rules[m].style.cursor)
                    rules[m].style.old_cursor = rules[m].style.cursor;
                else
                    rules[m].style.old_cursor = '';
                rules[m].style.cursor = c;
            }
        }
    }
}

function restoreCursor()
{
    if(remote_cursor_changing)
    {
        setTimeout(restoreCursor,100);
    }
    else
    {
        var n;
        for(n = 0; n < document.styleSheets.length;n++)
        {
            var rules = new Array();
            if(document.styleSheets[n].cssRules)
                rules = document.styleSheets[n].cssRules;
            else if(document.styleSheets[n].rules)
                rules = document.styleSheets[n].rules;
            
            for(m = 0;m < rules.length;m++)
            {
                if(rules[m].style.old_cursor)
                    rules[m].style.cursor = rules[m].style.old_cursor;
                else
                    rules[m].style.cursor = '';
            }
        }
    }
}

function createImagePreview(path,name)
{
    var sizes = {
        collection_feature_thumbnail:{width:213,height:137},
        collection_thumbnail:{width:71,height:53}};

    var width = 320;
    var height = 200;

    if(name && sizes[name])
    {
        width = sizes[name].width;
        height = sizes[name].height;
    }

    //hack to make sure the unresized image isnt cached
    var rand = Math.random().toString().split('.').last();
    var fn_parts = path.split('.');
    fn_parts.splice(fn_parts.length-1,0,rand);

    var preview = new Element('img',{src:fn_parts.join('.')});
    preview.setStyle({width:width+'px',height:height+'px'});
    return preview;
}
