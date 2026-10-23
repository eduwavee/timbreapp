<?php

namespace App\Enums;

enum ListingOperation: string
{
    case Sale = 'venta';
    case Rent = 'alquiler';

    public function label(): string
    {
        return match ($this) {
            self::Sale => 'Venta',
            self::Rent => 'Alquiler',
        };
    }

    /** El verbo del cartel. */
    public function verb(): string
    {
        return match ($this) {
            self::Sale => 'Vende',
            self::Rent => 'Alquila',
        };
    }
}
