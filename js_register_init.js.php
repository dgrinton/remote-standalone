<?php 
    $rules = JsRegister::current()->getRules();
    $onloads = JsRegister::current()->getOnloads(); 
?>
JsRegister.configure(
    '<?php echo json_encode($rules); ?>'.evalJSON(),
    '<?php echo json_encode($onloads); ?>'.evalJSON()
);
