var RemoteForm = function()
{
    var img_types = 'jpg,jpeg,gif,png,bmp'.split(',');
    var sessId;
    var uploadDir;
    var first_slot_shown = new Hash();
    var upload_slots = new Hash();
    var comment_metadata = new Hash();
    var onsubmit_hash = new Hash();
    var onreturn_hash = new Hash();
    var upload_iframe = '/upload.php';

    var _pub = 
    {
        setUploadDir: function(dir)
        {
            uploadDir = dir;
        },

        initForms: function()
        {
            initForms();
        },

        setSessId: function(id)
        {
            sessId = id;
        },

        fileLoading: function(input_id)
        {
            var iframe = $$('iframe#'+input_id)[0];
            var parts = iframe.name.match(/([^[]+)\[(\d+)\]/);
            if(parts)
            {
                var name = parts[1];
                var num = parseInt(parts[2]);
                var next = null;
                var selector = 'iframe[name="'+name+'['+(num+1)+']"]';
                next = $$(selector)[0];
                if(next)
                    next.show();
                iframe.hide();
                iframe.insert({after:new Element('p',{
                    'class':'fancy_upload_progress'}).update('loading...')});
            }
            else
            {
                RemoteForm.fileLoadingSingle(iframe);
            }
            iframe.up('form').down('input[type="submit"]').disable();
        },
    
        fileLoadingSingle: function(iframe)
        {
            iframe.loading_indicator = new Element('p',{
                'class':'fancy_upload_progress'}).update('loading...');
            iframe.insert({after:iframe.loading_indicator});
        },
    
        fileDoneLoading: function(input_id,filename)
        {
            var iframe = $$('iframe#'+input_id)[0];
            iframe.up('form').down('input[type="submit"]').enable();
    
            var parts = iframe.name.match(/([^[]+)\[(\d+)\]/);
            var name = null, num = null;
            if(parts)
            {
                name = parts[1];
                num = parts[2];
                replaceSlot(name,num,createSlot(filename,num,name,true));
            }
            else
            {
                RemoteForm.fileDoneLoadingSingle(iframe,filename);
            }
        },

        fileDoneLoadingSingle: function(iframe,filename)
        {
            iframe.loading_indicator.remove();
            if(isImage(filename))
            {
                if(window.createImagePreview)
                    iframe.preview = createImagePreview(uploadDir + filename,
                        iframe.name);
                iframe.insert({after:iframe.preview});
            }
            iframe.hidden_input = new
            Element('input',{type:'hidden',value:filename,name:iframe.name});
            iframe.insert({after:iframe.hidden_input});
            iframe.current_p = new Element('p').update('Currently: '+filename);
            var del_button = new Element('button').update('Delete');
            del_button.remoteObserve('click',function(){
                iframe.current_p.remove();
                iframe.hidden_input.remove();
                if(iframe.preview)
                    iframe.preview.remove();
                iframe.src = iframe.first_url;
                iframe.show();
            });
            iframe.current_p.insert(del_button);
            iframe.insert({after:iframe.current_p});
            iframe.hide();
        },

        addOnSubmit: function(form,callback)
        {
            if(typeof(form) == 'object')
                form = form.identify();
            
            var existing_callbacks = onsubmit_hash.get(form);
            if(!existing_callbacks)
                existing_callbacks = new Array();

            existing_callbacks.push(callback);
            onsubmit_hash.set(form,existing_callbacks);
        },

        addOnReturn: function(form,callback)
        {
            if(typeof(form) == 'object')
                form = form.identify();
            
            var existing_callbacks = onreturn_hash.get(form);
            if(!existing_callbacks)
                existing_callbacks = new Array();

            existing_callbacks.push(callback);
            onreturn_hash.set(form,existing_callbacks);
        },

        fireOnReturns: function(form,transport,validated)
        {
            if(typeof(form) == 'object')
                form = form.identify();

            callbacks = onreturn_hash.get(form);
            if(callbacks)
                callbacks.each(function(callback)
                {
                    try
                    {
                        callback(validated);
                    }
                    catch(e)
                    {
                        if(Remote.dev())
                            alert('onreturn callback threw exception: ' + e +
                            '\n' + callback);
                    }
                });

        },

        clearOnSubmits: function(form)
        {
            if(typeof(form) == 'object')
                form = form.identify();

            onsubmit_hash.unset(form);
        },

        clearOnReturns: function(form)
        {
            if(typeof(form) == 'object')
                form = form.identify();

            onreturn_hash.unset(form);
        }
    };



    var isImage = function(filename)
    {
        var ret = false;

        var ext = filename.split('.').last().toLowerCase();
        if(img_types.indexOf(ext) != -1)
            ret = true;

        return ret;
    }

    var replaceSlot = function(name,num,new_slot)
    {
        //remove the entire slot
        var el = comment_metadata.get(name)[num].first;
        var last = comment_metadata.get(name)[num].last;
        var before = el.previousSibling;
        var after = null;
        if(last)
            after = last.nextSibling;
        var above = el.parentNode;

        //wipe old slot
        while(el) 
        {
            var next = el.nextSibling;
            el.parentNode.removeChild(el);
            if(el == last || !el)
                break;
            else
                el = next;
        }

        //insert new slot
        while(new_slot.lastChild)
            if(after)
                after.parentNode.insertBefore(new_slot.lastChild,after);
            else
                above.insert(new_slot.lastChild);

        //update the first/last elements for this slot
        comment_metadata.get(name)[num].first = before.nextSibling;
        if(after)
            comment_metadata.get(name)[num].last = after.previousSibling;
        else
            comment_metadata.get(name)[num].last = null;
    };

    var ajaxDeleteFile = function(filename)
    {
        new Ajax.Request('index.php?h=DeleteFile&filename='+filename);
    };

    var readCommentMetaData = function()
    {
        //console.log('readmetadata');
        $$('meta.remote_form').each(function(c)
        {
            var parts = c.readAttribute('value').split(' ');
            if(parts[0] == 'start_slot' || parts[0] == 'end_slot')
            {
                var name = parts[1];
                var index = parts[2];
                var field = comment_metadata.get(name);
                if(!field)
                {
                    field = new Array();
                    comment_metadata.set(name,field);
                }
                var slot = field[index];
                if(!slot)
                {
                    slot = {};
                    field[index] = slot;
                }

                if(parts[0] == 'start_slot')
                    slot.first = c.nextSibling;
                else
                    slot.last = c.previousSibling;

                c.remove();
            }
        });
    };

    var initForms = function()
    {
        //console.log('initforms');
        upload_slots = new Hash();
        readCommentMetaData();

        $$('form').each(initForm);

        //fancy iframe upload
        window.fileLoading = RemoteForm.fileLoading;
        window.fileDoneLoading = RemoteForm.fileDoneLoading;
        try
        {
            $$('input[type="file"]').each(initIframeAjaxUpload);
        }
        catch(e)
        {
            alert('uncaught exception in initForms: '+e);
        }
        upload_slots.each(function(pair)
        {
            sortFileUploads(pair.key);
        });
    };
    
    var initForm = function(form)
    {
        form.remoteObserve('submit',function(ev)
        {
            ev.stop();

            //remove name attribute from submit inputs so they don't get
            //serialized
            form.select('input[type="submit"]').each(function(btn)
            {
                btn.real_name = btn.name;
                btn.name = '';
            });

            var callbacks = onsubmit_hash.get(form.identify());
            if(callbacks)
            {
                callbacks.each(function(callback)
                {
                    try
                    {
                        callback();
                    }
                    catch(e)
                    {
                        if(Remote.dev())
                            alert('callback function caused exception: '+e+ '\n'
                            + callback);
                    }
                });
            }

            Remote.formSubmit(form);

            //tidy hidden inputs
            $$('.remote_hidden_form_submit').each(Element.remove);

            //restore names to submit inputs
            form.select('input[type="submit"]').each(function(btn)
            {
                btn.name = btn.real_name;
            });
            form.submitted_via_return = false;
        });

        //when a button is clicked add a hidden input that will get serialized,
        //unless the button click event is the result of hitting enter in a text
        //input
        form.select('input[type="submit"]').each(function(btn)
        {
            btn.remoteObserve('click',function()
            {
                if(!form.submitted_via_return)
                    form.insert(new Element('input',{
                        type:'hidden',
                        name:btn.name,
                        value:btn.value,
                        'class':'remote_hidden_form_submit'
                    }));
            });
        });

        //listen for enter keypress on all inputs - this will trigger a 'click'
        //event on the first <input type="submit"/> element in the form
        form.select('input').each(function(i)
        {
            i.remoteObserve('keypress',function(ev)
            {
                if(ev.keyCode == 13)
                    form.submitted_via_return = true;
            });
        });
        if(!form.down('input[name="web_2"]'))
            form.insert(new Element('input',
                {type:'hidden',name:'web_2',value:'yesplz'}));
    };

    var sortFileUploads = function(name)
    {
        //console.log('sort');
        var files = new Array();
        var tmp = comment_metadata.get(name);
        var count = tmp.length;
        var n;
        for(n = 0;n < count;n++)
        {
            //try to find a hidden input, which indicates the slot is occupied
            var input = $$('input[type="hidden"][name="'+name+'['+n+']"]')[0];
            if(input)
                files.push(input.value);
        }
        n = 0;
        files.each(function(file)
        {
            var new_slot = createSlot(file,n,name,true);
            replaceSlot(name,n++,new_slot);
        });
        //fill in remaining empty slots
        var first_empty = true;
        while(n < count)
        {
            var new_slot = createSlot(null,n,name,first_empty ? false : true);
            replaceSlot(name,n++,new_slot);
            first_empty = false;
        }
    };

    var createSlot = function(filename,index,name,hide)
    {
        var new_slot = new Element('div');
        new_slot.innerHTML =
        upload_slots.get(name).template.innerHTML;
        var existing = new_slot.down('div.existing_file_template');
        if(existing)
        {
            if(filename)
            {
                while(existing.firstChild)
                    existing.parentNode.insertBefore(existing.firstChild,existing);
                existing.remove();
            }
            else
                existing.remove();
        }
        var file_input = new_slot.down('input[type="file"]');
        if(filename)
        {
            file_input.remove();
            //icon:
            if(isImage(filename))
            {
                var icon = new_slot.down('img.existing_icon');
                if(icon)
                {
                    //hack to make sure the unresized image isnt cached
                    var rand = Math.random().toString().split('.').last();
                    var fn_parts = filename.split('.');
                    fn_parts.splice(fn_parts.length-1,0,rand);
                    icon.src = uploadDir+fn_parts.join('.');
                }
            }
            //existing-name:
            var existing_name = new_slot.down('div.existing_name_template');
            if(existing_name)
                existing_name.replace(filename);

            //insert hidden input
            var hidden = new Element('input',{
                type:'hidden',
                name:name+'['+index+']',
                value:filename
            });
            new_slot.insert(hidden);

            //delete-checkbox:
            var checkbox = new_slot.down('div.delete_existing_checkbox_template');
            if(checkbox)
            {
                var delete_callback = function()
                {
                    //replaceSlot(name,index,createSlot(null,index,name));
                    hidden.name = '';
                    sortFileUploads(name);
                };
                checkbox.replace(new Element('button')
                    .update('Delete').remoteObserve('click',delete_callback));
            }
        }
        else
        {
            file_input.name = name + '[' + index + ']';
            iframe = initIframeAjaxUpload(file_input);
            if(hide)
                iframe.hide();
            else
                iframe.show();
        }

        return new_slot;
    };

    var initIframeAjaxUpload = function(i)
    {
        var cur = i;
        while(cur && cur != document.body)
        {
            if (cur.match('div.file_input_cluster_template'))
                return;
            cur = cur.up();
        }

        var iframe = new Element('iframe',{
            src:upload_iframe+'?session_id='+sessId
            +'&upload_dir='+uploadDir
            +'&id='+i.identify(),
            id:i.identify(),
            name:i.name,
            'class':i.className,
            frameborder:'0'
        });
        iframe.addClassName('fancy_upload');
        iframe.first_url = iframe.src;
        iframe.hidden_index = 0;
        i.replace(iframe);
        var parts = i.name.match(/([^[]+)\[(\d+)\]/);
        if(parts)
        {
            //grab template for this slot
            var name = parts[1];
            var num = parts[2];

            if(!upload_slots.get(name))
            {
                var template = $$('div.file_input_cluster_template#'
                 +name+'_template')[0];
                if(template)
                    template.remove();
                var new_slot = {
                    'template':template,
                    first_slot_shown:false
                };
                upload_slots.set(name,new_slot);
            }

            //hide all but the first non-empty slot
            //if a slot isn't empty it will have a hidden input corresponding to
            //it
            var hidden = $$('input[type="hidden"][name="'+i.name+'"]')[0];
            if(hidden)
                iframe.hide();
            else if(!upload_slots.get(name).first_slot_shown)
                upload_slots.get(name).first_slot_shown = true;
            else
                iframe.hide();
        }

        return iframe;
    };

    return _pub;
}();
