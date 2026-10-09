<?php

namespace App\Enums;

enum PropertyType: string
{
    case House = 'casa';
    case Apartment = 'departamento';
    case Warehouse = 'galpon';

    public function label(): string
    {
        return match ($this) {
            self::House => 'Casa',
            self::Apartment => 'Departamento',
            self::Warehouse => 'Galpón',
        };
    }
}
