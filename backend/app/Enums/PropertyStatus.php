<?php

namespace App\Enums;

enum PropertyStatus: string
{
    case Available = 'disponible';
    case Occupied = 'ocupada';
    case Maintenance = 'mantenimiento';

    public function label(): string
    {
        return match ($this) {
            self::Available => 'Disponible',
            self::Occupied => 'Ocupada',
            self::Maintenance => 'En mantenimiento',
        };
    }
}
