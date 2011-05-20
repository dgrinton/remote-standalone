<?php
    class Jsonml
    {
        private static $xsl = null;

        private static function init()
        {
            self::$xsl = new XSLTProcessor();
            $style = new DomDocument();
            $style->load('../JsonML.xslt');
            self::$xsl->importStylesheet($style);
        }

        static function encode($data)
        {
            if(self::$xsl == null)
                self::init();

            //todo not actually sure that this is sane
            $new_data = '';
            $new_data .= '<?xml version="1.0" encoding="utf8"?>';
            $new_data .= '<fragment>'.str_replace('&','&amp;',html_entity_decode($data)).'</fragment>';

            $src = new DomDocument('1.0', 'utf8');
            $src->preserveWhiteSpace = false;
            /*
            if(!$src->loadXML($new_data))
                die($data.PHP_EOL.$new_data);
            */
            if(constant('DEVELOPMENT'))
                $src->loadXML($new_data);
            else
                @$src->loadXML($new_data);

            //die($src->saveHTML());
            return self::$xsl->transformToXml($src);
        }
    }
?>
