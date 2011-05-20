<?php
    if(array_key_exists('no_reply',$_GET)) {
        die();
    }
    require('../jsonml.class.php');
    if(array_key_exists('remote_num',$_GET)) {
        $target = $_GET['target'];
        $ret = array();
        $ret[] = array(
            'id'=>'',
            'attribute'=>'css',
            'value'=>Jsonml::encode(''),
        );
        if(array_key_exists('form',$_POST)) {
            ob_start();
            print_r($_POST);
            $data = ob_get_clean();
            $ret[] = array(
                'id'=>'main',
                'attribute'=>'innerHTML',
                'value'=>Jsonml::encode('<pre>'.$data.'</pre>'),
            );
        }
        else if(array_key_exists('upload',$_POST)) {
            rename('uploads/'.$_POST['what'],'accepted/'.$_POST['what']);
            header('Location: /index.php?target=images&remote_num='.$_GET['remote_num']);
        }
        else if($target == 'form') {
            $ret[] = array(
                'id'=>'main',
                'attribute'=>'innerHTML',
                'value'=>Jsonml::encode(file_get_contents('../form.html')),
            );
        }
        else if($target == 'images') {
            $files = glob('accepted/*');
            $data = '';
            foreach($files as $f) {
                $data .= '<img src="'.$f.'"/>';
            }
            $ret[] = array(
                'id'=>'main',
                'attribute'=>'innerHTML',
                'value'=>Jsonml::encode($data),
            );
        }
        else {
            $ret[] = array(
                'id'=>'main',
                'attribute'=>'innerHTML',
                'value'=>Jsonml::encode('<p>'.$target.'</p>'),
            );
            $ret[] = array(
                'id'=>'menu',
                'attribute'=>'test',
                'value'=>$target,
            );
            if($target == 'one') {
                $ret[] = array(
                    'id'=>'',
                    'attribute'=>'css',
                    'value'=>Jsonml::encode('<meta name="ws_remote"
                    class="conditional_css" value="[if gt ie6]"/><link
                    rel="stylesheet" href="css/red.css"/><meta name="ws_remote"
                    class="conditional_css" value="[endif]"/>'),
                );
            }
            else if($target == 'two') {
                $ret[] = array(
                    'id'=>'',
                    'attribute'=>'css',
                    'value'=>Jsonml::encode('<link rel="stylesheet" href="css/blue.css"/>'),
                );
            }
            else if($target == 'js1') {
                $ret[] = array(
                    'id'=>'',
                    'attribute'=>'static_js',
                    'value'=>array(array(
                        'path'=>'/js/script1.js',
                    )),
                );
            }
            else if($target == 'js2a' || $target == 'js2b') {
                $ret[] = array(
                    'id'=>'',
                    'attribute'=>'static_js',
                    'value'=>array(array(
                        'path'=>'/js/script2.js',
                        'runOnce'=>true,
                    )),
                );
            }
        }
        $ret[] = array(
            'id'=>'',
            'attribute'=>'get_str',
            'value'=>'target='.$target,
        );
        echo json_encode($ret);
    }
    else {
        echo file_get_contents('../base.html');
    }
?>
