initialisation:
   call Remote.initBeforeLoad(id_str, upload_dir, redirect_url) 
   -id_str is a unique id for this session
   it will be appended as remote_num to the GET parameters for each request
   along with ajax=1
   (TODO is ajax=1 redundant?)
   -upload dir is TODO
   -redirect_url is optional, if supplied then Remote will make a request for
   this url and load the changeset returned
   TODO what would it be used for?
   if redirect_url is not supplied then the client will make a request for the
   current page, supplying 'no_reply=true' in GET, this is to allow the backend
   to initialise
   note that if the browser url contains a '#' then Remote will make a request
   for the current url with the '#' replaced by a '?', and then load the
   changeset

regular page loading
   user clicks on a remote_exec anchor, or Remote.ajaxLoad(url) is called
   Remote makes a request for the url with GET parameters remote_num and
   ajax=1 appended
   server must return a json encoded array of responses which may be in one of
   the following forms:
   {
    "id":<id of some existing page element>",
    "attribute":"innerHTML",
    "value":<jsonml encoded innerhtml, wrapped in a fragment node>
   }
   {
    "id":<id of some existing page element>",
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
   TODO does css actually work in IE?
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
   you could avoid using dyn js entirely really..
   TODO other attributes: form_validated, style, onclick

caveats:
requests for '/' need to find the furnisher
remote anchors need the class "remote_exec"
