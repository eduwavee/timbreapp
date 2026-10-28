<?php

/*
 * Mensajes de validación en castellano rioplatense, para las reglas que usa la app.
 * Las que no están acá caen al inglés del framework.
 */
return [
    'accepted' => 'Tenés que aceptar :attribute.',
    'after' => ':Attribute tiene que ser posterior al :date.',
    'after_or_equal' => ':Attribute tiene que ser el :date o después.',
    'array' => ':Attribute no tiene el formato correcto.',
    'before' => ':Attribute tiene que ser anterior al :date.',
    'before_or_equal' => ':Attribute tiene que ser el :date o antes.',
    'between' => [
        'array' => ':Attribute tiene que tener entre :min y :max elementos.',
        'file' => ':Attribute tiene que pesar entre :min y :max kB.',
        'numeric' => ':Attribute tiene que estar entre :min y :max.',
        'string' => ':Attribute tiene que tener entre :min y :max caracteres.',
    ],
    'boolean' => ':Attribute tiene que ser sí o no.',
    'date' => ':Attribute no es una fecha válida.',
    'date_format' => ':Attribute no tiene el formato :format.',
    'decimal' => ':Attribute tiene que tener :decimal decimales.',
    'digits' => ':Attribute tiene que tener :digits dígitos.',
    'digits_between' => ':Attribute tiene que tener entre :min y :max dígitos.',
    'email' => 'Revisá :attribute: no parece un email válido.',
    'enum' => 'Elegí una opción válida para :attribute.',
    'exists' => 'Elegí una opción válida para :attribute.',
    'file' => ':Attribute tiene que ser un archivo.',
    'gt' => [
        'numeric' => ':Attribute tiene que ser mayor que :value.',
    ],
    'gte' => [
        'numeric' => ':Attribute tiene que ser :value o más.',
    ],
    'image' => ':Attribute tiene que ser una imagen.',
    'in' => 'Elegí una opción válida para :attribute.',
    'integer' => ':Attribute tiene que ser un número entero.',
    'max' => [
        'array' => ':Attribute no puede tener más de :max elementos.',
        'file' => ':Attribute no puede pesar más de :max kB.',
        'numeric' => ':Attribute no puede ser mayor que :max.',
        'string' => ':Attribute no puede tener más de :max caracteres.',
    ],
    'mimes' => ':Attribute tiene que ser un archivo :values.',
    'mimetypes' => ':Attribute tiene que ser un archivo :values.',
    'min' => [
        'array' => ':Attribute tiene que tener al menos :min elementos.',
        'file' => ':Attribute tiene que pesar al menos :min kB.',
        'numeric' => ':Attribute tiene que ser al menos :min.',
        'string' => ':Attribute tiene que tener al menos :min caracteres.',
    ],
    'numeric' => ':Attribute tiene que ser un número.',
    'present' => 'Falta :attribute.',
    'prohibited' => ':Attribute no se puede enviar.',
    'regex' => 'Revisá :attribute: el formato no es válido.',
    'required' => 'Completá :attribute.',
    'required_if' => 'Completá :attribute.',
    'required_with' => 'Completá :attribute.',
    'required_without' => 'Completá :attribute o :values.',
    'size' => [
        'array' => ':Attribute tiene que tener :size elementos.',
        'file' => ':Attribute tiene que pesar :size kB.',
        'numeric' => ':Attribute tiene que ser :size.',
        'string' => ':Attribute tiene que tener :size caracteres.',
    ],
    'string' => ':Attribute tiene que ser texto.',
    'unique' => 'Ya hay otro registro con ese :attribute.',
    'url' => 'Revisá :attribute: no parece una dirección web válida.',

    'attributes' => [],
];
