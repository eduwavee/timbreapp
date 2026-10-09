<?php

namespace App\Http\Resources;

use BackedEnum;

class EnumValue
{
    /**
     * @return array{value: string, label: string}|null
     */
    public static function of(?BackedEnum $enum): ?array
    {
        if ($enum === null) {
            return null;
        }

        return ['value' => $enum->value, 'label' => method_exists($enum, 'label') ? $enum->label() : $enum->value];
    }
}
