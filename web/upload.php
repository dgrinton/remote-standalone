<?php
    /**
    * This file is an adapted version of the method found here:
    * http://www.air4web.com/files/upload/
    * by Martin Konicek. Thanks Martin!
    */
    //first get the session name
    if(isset($_GET['session_id']))
        $session_id = $_GET['session_id'];
    else if(isset($_POST['session_id']))
        $session_id = $_POST['session_id'];
    else
        die('You must pass a session id to upload.php');
    //now get the directory to upload to
    if(isset($_GET['upload_dir']))
        $upload_dir = $_GET['upload_dir'];
    else if(isset($_POST['upload_dir']))
        $upload_dir = $_GET['upload_dir'];
    else
        die('You must pass a directory to upload to');

    //ensure the upload dir is within our app
    $install_dir = realpath(dirname('.').'/../').'/';
    $upload_dir = realpath($upload_dir).'/';
    if(strpos(realpath($upload_dir),$install_dir) !== 0)
        die('illegal upload dir');

    //now get the unique identifier for this upload
    if(isset($_GET['id']))
        $id = $_GET['id'];
    else if(isset($_GET['id']))
        $id = $_POST['id'];
    else
        die('You must pass a unique identifier for this file');
    //see if a class was set
    if(isset($_GET['class']))
        $class = $_GET['class'];
    else
        $class = '';
    //now start the session and retrieve the auth code
    session_id($session_id);
    require_once('../mime_list.class.php');
    session_start();
    // you'd probably normally do this in the view that displayed the form, or
    // somewhere more sensible
    $ml = new MimeList();
    $ml->allowImages();
    $_SESSION['mime_list'] = $ml;
    
    if(isset($_SESSION['ajax_upload_auth_code']))
        $auth_code = $_SESSION['ajax_upload_auth_code'];
    else
        $auth_code = NULL;
    $auth_code = 'whatever';

    //check if there is an auth code present in post
    if(isset($_POST['ajax_upload_auth_code'])&&($auth_code!=NULL))
    {
        //if there is, check it is the same as the session one
        $posted_auth_code = $_POST['ajax_upload_auth_code'];

        if($auth_code==$posted_auth_code)
        {
            if(isset($_FILES['uploaded_file']['tmp_name']))
                $ftmp = $_FILES['uploaded_file']['tmp_name'];
            else
                $ftmp = '';
            
            if(isset($_FILES['uploaded_file']['name']))
                $oname = $_FILES['uploaded_file']['name'];
            else
                $oname = '';
            
            if(isset($_FILES['uploaded_file']['name']))
                $fname = $upload_dir.$_FILES['uploaded_file']['name'];
            else
                $fname = '';
            
            if($ftmp&&$fname)
            {
                if(isset($_SESSION['mime_list'])&&($_SESSION['mime_list'] instanceof MimeList))
                {
                    try
                    {
                        if($_SESSION['mime_list']->fileAllowed($_FILES['uploaded_file']['type'],$fname))
                        {
                            if(move_uploaded_file($ftmp, $fname))
                            {
                                ?>
                                <html><head><script>
                                if(window.parent.fileDoneLoading)
                                    window.parent.fileDoneLoading("<?php echo($id);?>","<?php echo($oname);?>");
                                else
                                    alert("There is no fileDoneLoading function provided");
                                </script></head>
                                </html>
                                <?php
                                exit();
                            }
            
                            else
                                die('Failed uploading');
                        }
                    }
                    
                    catch(MimeException $exc)
                    {
                        die('Failed uploading: '.$exc->getMessage());
                    }
                }

                else
                    die('Failed uploading');
            }
            
            else
                die('Could not get file details');
        }
        //if they are not equal, stop processing and give an error
        else
        {
            die('Sorry, this session has expired. You will need to login again in order to upload files');
        }
    }
?>
<html><head>
<script language="javascript">
function upload(){

    if(window.parent.fileLoading)
        window.parent.fileLoading("<?php echo($id);?>");

    document.iform.submit();
}
</script>
<style type="text/css">
body {
        padding:0; 
        margin:0;
        border:0; 
}

form#iform, form#iform { 
        padding:0; 
        margin:0;
        border:0; 
}
</style>
</head><body>
<form id="iform" name="iform" action="" method="POST" enctype="multipart/form-data">
<input type="hidden" name="session_id" value="<?php echo($session_id);?>" />
<input type="hidden" name="upload_dir" value="<?php echo($upload_dir);?>" />
<input type="hidden" name="id" value="<?php echo($id);?>" />
<input type="hidden" name="ajax_upload_auth_code" value="<?php echo($auth_code);?>" />
<input id="file" type="file" class="<?php echo($class);?>" name="uploaded_file" onchange="upload()" />
</form>
</html>
