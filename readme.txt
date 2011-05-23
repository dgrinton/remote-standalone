installing this sample site:
    the web dir must be web accessible, and the uploads and accepted dirs must
    be web writable
    the relative directory layout must be kept the same

how the sample site works:

initialisation:
    call Remote.initBeforeLoad(id_str, upload_dir, redirect_url) from head (ie
    not after window load)
    -id_str is a unique id for this session
    it will be appended as remote_num to the GET parameters for each request
    along with ajax=1 (which means nothing really)
    -upload dir is a path relative to furnisher where ajax file uploads will go
    -redirect_url is optional, if supplied then Remote will make a request for
    this url and load the changeset returned
    the purpose of this is (probably) because if the server just redirected the
    request then the browser url wouldnt be updated, although get_str addresses
    this, so maybe this is redundant?
    if redirect_url is not supplied then the client will make a request for the
    current page, supplying 'no_reply=true' in GET, this is to allow the backend
    to initialise (also possibly redundant based on your backend)
    note that if the browser url contains a '#' then Remote will make a request
    for the current url with the '#' replaced by a '?', and then load the
    changeset

haxload transition:
    if the first page loaded contains '?' in the url, then the next time a page
    is loaded (lets say the page being loaded is ?something=what&red=great)
    remote will send a (GET?) request to furnisher?h=Haxload with the parameter
    target containing the query part of the request (something=what&red=great)
    the idea here is that the server will store this, because when the request
    returns Remote will set the window.location to
    #something=what&red=great&transition - the server won't see anything after
    the '#' but it knows what to load because of the HaxLoad request
    the "transition" parameter is used to alter the behavior of Remote during
    startup, and will then be removed 

rebuildpage:
    this may not be necessary depending on how your backend works, but if remote
    receives an update like this:
    {
     "id":"remote-rebuild-page",
     "value":<jsonml encoded html for head and body nodes, wrapped in a fragment node>
    }
    it will replace the head/body innerhtml with the provided markup

regular page loading:
    user clicks on a remote_exec anchor, or Remote.ajaxLoad(url) is called
    Remote makes a request for the url with GET parameters remote_num and
    ajax=1 appended
    server must return a json encoded array of responses which may be in one of
    the following forms:
    {
     "id":<id of some existing page element>,
     "attribute":"innerHTML",
     "value":<jsonml encoded innerhtml, wrapped in a fragment node>
    }
    {
     "id":<id of some existing page element>,
     "attribute":"style",
     "value":<semicolon separated list of stylesheet rules which will be applied
     to element>
    }
    {
     "id":<id of some existing page element>,
     "attribute":<anything else>,
     "value":<value of attribute to set>
    }
    {
     "id":"",
     "attribute":"css",
     "value":<jsonml encoded stylesheet link nodes, with optional meta nodes>
    }
    meta nodes for stylesheets work like follows:
    <meta name="ws_remote" value="<conditional as in html comment>"/>
     <!--link nodes go here-->
    <meta name="ws_remote" value="[endif]">
    {
     "id":"",
     "attribute":"get_str",
     "value":<GET string to set in browser url bar>
    }
    note that get_str is only necessary if the backend redirects a request (in
    this case the browser needs to be notified of the correct location)
    {
     "id":"",
     "attribute":"static_js",
     "value":[{
         "path":<path to script file>,
         "runOnce":<true if this script is not to be reattached each time a page
         containing it is loaded>
     }]
    }
    {
     "id":"",
     "attribute":"dyn_js",
     "value":<code to be evaluated after page load>
    }
    note that dyn js is run before static_js is attached
    the idea of dyn js is that you might need to dynamically generate some js
    and serve it straight up and you don't want to store it somewhere and wait
    for the browser to make another request for it

forms:
    forms submitted by remote have an extra parameter added: "web2"
    file upload fields will be replaced with an iframe as per the upload_iframe
    variable at the top of remote_form.js, the iframe url will also contain the
    id_str and upload_dir vars passed to Remote.initBeforeLoad, and the id,
    name and class of the input 
    once the file finishes uploading the form may be submitted
    if the "remove" button next to the field is not clicked then the submitted
    form data will contain the path to the uploaded file, in the upload_dir
    directory, it is then up to the backend to move this somewhere permanent
    NOTE: clicking the "remove" button doesn't actually remove the file on the
    backend, just prevents it from being submitted with the form
    NOTE: indexed file upload fields are not supported
    before submitting a form the RemoteForm.addOnReturn(form,callback) function
    can be used to add callbacks that will be run as soon as the form submission
    request returns
    the backend can indicate form validation with:
    {
     "id":"",
     "attribute":"form_validated",
     "value":<an object that will be passed to callbacks added with addOnReturn>
    }

JsRegister:
    works in conjunction with remote to provide onload functionality, properly
    scoped observers and timeouts

ScriptWrangler:
    works in conjunction with remote to dynamically attach/remove script nodes
    and performs crude scope tidying (examine window before adding script,
    examine it again after, store the difference in what is defined, and when
    the script is unloaded remove the difference)
    the whenDone function allows callbacks to be added which will be triggered
    after all static js has been loaded (these are then cleared)

Browser History:
    Remote uses RSH (really simple history)

caveats:
requests for '/' need to find the furnisher
remote anchors need the class "remote_exec"
